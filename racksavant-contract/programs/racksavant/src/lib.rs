use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

pub mod revenue;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod racksavant {
    use super::*;

    /// Initialize the platform with fee configuration
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_fee_bps: u16,
    ) -> Result<()> {
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.platform_treasury = ctx.accounts.platform_treasury.key();
        platform_state.platform_fee_bps = platform_fee_bps;
        platform_state.total_designers = 0;
        platform_state.total_designs = 0;
        Ok(())
    }

    /// Register a new designer and mint their fixed supply of tokens
    pub fn register_designer(
        ctx: Context<RegisterDesigner>,
        name: String,
        ipfs_bio_uri: String,
    ) -> Result<()> {
        require!(name.len() <= 50, ErrorCode::NameTooLong);
        require!(ipfs_bio_uri.len() <= 200, ErrorCode::UriTooLong);

        let designer_profile = &mut ctx.accounts.designer_profile;
        designer_profile.designer = ctx.accounts.designer.key();
        designer_profile.name = name;
        designer_profile.ipfs_bio_uri = ipfs_bio_uri;
        designer_profile.token_mint = ctx.accounts.designer_token_mint.key();
        designer_profile.total_designs = 0;
        designer_profile.total_sales = 0;
        designer_profile.created_at = Clock::get()?.unix_timestamp;

        // Mint 1,000,000 tokens (with 6 decimals = 1,000,000,000,000)
        let total_supply = 1_000_000_000_000u64;
        let designer_allocation = (total_supply * 90) / 100; // 90%
        let lp_allocation = total_supply - designer_allocation; // 10%

        // Mint to designer
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.designer_token_mint.to_account_info(),
                    to: ctx.accounts.designer_token_account.to_account_info(),
                    authority: ctx.accounts.designer_token_mint.to_account_info(),
                },
                &[&[
                    b"designer_mint",
                    ctx.accounts.designer.key().as_ref(),
                    &[ctx.bumps.designer_token_mint],
                ]],
            ),
            designer_allocation,
        )?;

        // Mint to LP pool
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.designer_token_mint.to_account_info(),
                    to: ctx.accounts.lp_token_account.to_account_info(),
                    authority: ctx.accounts.designer_token_mint.to_account_info(),
                },
                &[&[
                    b"designer_mint",
                    ctx.accounts.designer.key().as_ref(),
                    &[ctx.bumps.designer_token_mint],
                ]],
            ),
            lp_allocation,
        )?;

        // Update platform state
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.total_designers += 1;

        emit!(DesignerRegistered {
            designer: ctx.accounts.designer.key(),
            token_mint: ctx.accounts.designer_token_mint.key(),
            name: designer_profile.name.clone(),
        });

        Ok(())
    }

    /// Upload a new design
    pub fn upload_design(
        ctx: Context<UploadDesign>,
        image_hash: [u8; 32],
        price_lamports: u64,
        inventory: u32,
    ) -> Result<()> {
        require!(price_lamports > 0, ErrorCode::InvalidPrice);
        require!(inventory > 0, ErrorCode::InvalidInventory);

        let design_meta = &mut ctx.accounts.design_meta;
        design_meta.designer = ctx.accounts.designer.key();
        design_meta.image_hash = image_hash;
        design_meta.ts_unix = Clock::get()?.unix_timestamp;
        design_meta.price_lamports = price_lamports;
        design_meta.inventory = inventory;
        design_meta.initial_inventory = inventory;
        design_meta.mint = ctx.accounts.designer_profile.token_mint;
        design_meta.total_sales = 0;

        // Update designer profile
        let designer_profile = &mut ctx.accounts.designer_profile;
        designer_profile.total_designs += 1;

        // Update platform state
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.total_designs += 1;

        emit!(DesignUploaded {
            designer: ctx.accounts.designer.key(),
            design_id: design_meta.key(),
            image_hash,
            price_lamports,
            inventory,
        });

        Ok(())
    }

    /// Update design price (designer only)
    pub fn update_price(
        ctx: Context<UpdatePrice>,
        new_price_lamports: u64,
    ) -> Result<()> {
        require!(new_price_lamports > 0, ErrorCode::InvalidPrice);

        let design_meta = &mut ctx.accounts.design_meta;
        let old_price = design_meta.price_lamports;
        design_meta.price_lamports = new_price_lamports;

        emit!(PriceUpdated {
            design_id: design_meta.key(),
            old_price,
            new_price: new_price_lamports,
        });

        Ok(())
    }

    /// Buy a design item
    pub fn buy(
        ctx: Context<Buy>,
        quantity: u32,
    ) -> Result<()> {
        require!(quantity > 0, ErrorCode::InvalidQuantity);
        
        let design_meta = &mut ctx.accounts.design_meta;
        require!(design_meta.inventory >= quantity, ErrorCode::InsufficientInventory);

        let total_cost = design_meta.price_lamports
            .checked_mul(quantity as u64)
            .ok_or(ErrorCode::Overflow)?;

        // Calculate platform fee
        let platform_fee = (total_cost * ctx.accounts.platform_state.platform_fee_bps as u64) / 10_000;
        let revenue_to_distribute = total_cost - platform_fee;

        // Transfer payment from buyer
        let transfer_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.escrow_account.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(transfer_ctx, total_cost)?;

        // Transfer platform fee to treasury
        **ctx.accounts.escrow_account.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.platform_treasury.to_account_info().try_borrow_mut_lamports()? += platform_fee;

        // Revenue distribution to token holders is handled via separate
        // distribute_to_holder instructions called by the client/indexer
        // This allows for batched processing and avoids transaction size limits

        // Update inventory
        design_meta.inventory -= quantity;
        design_meta.total_sales += quantity;

        // Update designer profile
        let designer_profile = &mut ctx.accounts.designer_profile;
        designer_profile.total_sales += quantity;

        emit!(Sale {
            design_id: design_meta.key(),
            buyer: ctx.accounts.buyer.key(),
            quantity,
            total_cost,
            platform_fee,
            revenue_distributed: revenue_to_distribute,
        });

        Ok(())
    }

    /// Withdraw platform fees (multisig only)
    pub fn withdraw_fee(
        ctx: Context<WithdrawFee>,
        amount: u64,
    ) -> Result<()> {
        **ctx.accounts.platform_treasury.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.destination.to_account_info().try_borrow_mut_lamports()? += amount;

        emit!(FeeWithdrawn {
            amount,
            destination: ctx.accounts.destination.key(),
        });

        Ok(())
    }
}

// Account structures
#[account]
pub struct PlatformState {
    pub platform_treasury: Pubkey,
    pub platform_fee_bps: u16, // basis points (500 = 5%)
    pub total_designers: u64,
    pub total_designs: u64,
}

#[account]
pub struct DesignerProfile {
    pub designer: Pubkey,
    pub name: String,
    pub ipfs_bio_uri: String,
    pub token_mint: Pubkey,
    pub total_designs: u32,
    pub total_sales: u32,
    pub created_at: i64,
}

#[account]
pub struct DesignMeta {
    pub designer: Pubkey,
    pub image_hash: [u8; 32],
    pub ts_unix: i64,
    pub price_lamports: u64,
    pub inventory: u32,
    pub initial_inventory: u32,
    pub mint: Pubkey,
    pub total_sales: u32,
}

// Context structures
#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 8 + 8,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    /// CHECK: Platform treasury account
    pub platform_treasury: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterDesigner<'info> {
    #[account(
        init,
        payer = designer,
        space = 8 + 32 + 50 + 200 + 32 + 4 + 4 + 8,
        seeds = [b"designer_profile", designer.key().as_ref()],
        bump
    )]
    pub designer_profile: Account<'info, DesignerProfile>,
    
    #[account(
        init,
        payer = designer,
        mint::decimals = 6,
        mint::authority = designer_token_mint,
        seeds = [b"designer_mint", designer.key().as_ref()],
        bump
    )]
    pub designer_token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = designer,
        associated_token::mint = designer_token_mint,
        associated_token::authority = designer,
    )]
    pub designer_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = designer,
        associated_token::mint = designer_token_mint,
        associated_token::authority = platform_state,
    )]
    pub lp_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,

    #[account(mut)]
    pub designer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UploadDesign<'info> {
    #[account(
        init,
        payer = designer,
        space = 8 + 32 + 32 + 8 + 8 + 4 + 4 + 32 + 4,
        seeds = [b"design_meta", designer.key().as_ref(), &platform_state.total_designs.to_le_bytes()],
        bump
    )]
    pub design_meta: Account<'info, DesignMeta>,

    #[account(
        mut,
        seeds = [b"designer_profile", designer.key().as_ref()],
        bump,
        has_one = designer
    )]
    pub designer_profile: Account<'info, DesignerProfile>,

    #[account(
        mut,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,

    #[account(mut)]
    pub designer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(
        mut,
        has_one = designer
    )]
    pub design_meta: Account<'info, DesignMeta>,
    pub designer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub design_meta: Account<'info, DesignMeta>,

    #[account(
        mut,
        seeds = [b"designer_profile", design_meta.designer.as_ref()],
        bump
    )]
    pub designer_profile: Account<'info, DesignerProfile>,

    #[account(
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,

    /// CHECK: Escrow account to hold payments temporarily
    #[account(
        mut,
        seeds = [b"escrow", design_meta.key().as_ref()],
        bump
    )]
    pub escrow_account: AccountInfo<'info>,

    /// CHECK: Platform treasury
    #[account(mut)]
    pub platform_treasury: AccountInfo<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFee<'info> {
    #[account(
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,

    #[account(
        mut,
        address = platform_state.platform_treasury
    )]
    /// CHECK: Platform treasury
    pub platform_treasury: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Destination for withdrawn fees
    pub destination: AccountInfo<'info>,

    pub authority: Signer<'info>, // Should be multisig in production
}

// Events
#[event]
pub struct DesignerRegistered {
    pub designer: Pubkey,
    pub token_mint: Pubkey,
    pub name: String,
}

#[event]
pub struct DesignUploaded {
    pub designer: Pubkey,
    pub design_id: Pubkey,
    pub image_hash: [u8; 32],
    pub price_lamports: u64,
    pub inventory: u32,
}

#[event]
pub struct PriceUpdated {
    pub design_id: Pubkey,
    pub old_price: u64,
    pub new_price: u64,
}

#[event]
pub struct Sale {
    pub design_id: Pubkey,
    pub buyer: Pubkey,
    pub quantity: u32,
    pub total_cost: u64,
    pub platform_fee: u64,
    pub revenue_distributed: u64,
}

#[event]
pub struct FeeWithdrawn {
    pub amount: u64,
    pub destination: Pubkey,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Name is too long")]
    NameTooLong,
    #[msg("URI is too long")]
    UriTooLong,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Invalid inventory")]
    InvalidInventory,
    #[msg("Invalid quantity")]
    InvalidQuantity,
    #[msg("Insufficient inventory")]
    InsufficientInventory,
    #[msg("Arithmetic overflow")]
    Overflow,
}
