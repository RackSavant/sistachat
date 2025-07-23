use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Revenue distribution module for token holders
/// This handles the complex logic of distributing sale revenue to all token holders
/// based on their proportional ownership of designer tokens

#[derive(Accounts)]
pub struct DistributeRevenue<'info> {
    #[account(mut)]
    pub design_meta: Account<'info, crate::DesignMeta>,
    
    /// CHECK: Escrow account holding the revenue to distribute
    #[account(
        mut,
        seeds = [b"escrow", design_meta.key().as_ref()],
        bump
    )]
    pub escrow_account: AccountInfo<'info>,
    
    /// The token mint for this designer
    #[account(
        seeds = [b"designer_mint", design_meta.designer.as_ref()],
        bump
    )]
    pub designer_token_mint: Account<'info, anchor_spl::token::Mint>,
    
    /// Token holder's account receiving revenue
    #[account(
        mut,
        constraint = holder_token_account.mint == designer_token_mint.key()
    )]
    pub holder_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: The holder receiving the revenue
    #[account(mut)]
    pub holder: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Distribute revenue to a single token holder
/// This instruction should be called once for each token holder
/// The client/indexer is responsible for finding all holders and calling this
pub fn distribute_to_holder(
    ctx: Context<DistributeRevenue>,
    total_revenue: u64,
    holder_balance: u64,
    total_supply: u64,
) -> Result<()> {
    require!(total_supply > 0, crate::ErrorCode::InvalidQuantity);
    require!(holder_balance > 0, crate::ErrorCode::InvalidQuantity);
    
    // Calculate proportional share: (holder_balance / total_supply) * total_revenue
    let holder_share = (total_revenue as u128)
        .checked_mul(holder_balance as u128)
        .ok_or(crate::ErrorCode::Overflow)?
        .checked_div(total_supply as u128)
        .ok_or(crate::ErrorCode::Overflow)? as u64;
    
    if holder_share > 0 {
        // Transfer lamports from escrow to holder
        **ctx.accounts.escrow_account.to_account_info().try_borrow_mut_lamports()? -= holder_share;
        **ctx.accounts.holder.to_account_info().try_borrow_mut_lamports()? += holder_share;
        
        emit!(RevenueDistributed {
            design_id: ctx.accounts.design_meta.key(),
            holder: ctx.accounts.holder.key(),
            amount: holder_share,
            holder_balance,
            total_supply,
        });
    }
    
    Ok(())
}

/// Event emitted when revenue is distributed to a holder
#[event]
pub struct RevenueDistributed {
    pub design_id: Pubkey,
    pub holder: Pubkey,
    pub amount: u64,
    pub holder_balance: u64,
    pub total_supply: u64,
}

/// Helper function to calculate revenue distribution
/// This can be used off-chain to determine distribution amounts
pub fn calculate_distribution(
    total_revenue: u64,
    holder_balance: u64,
    total_supply: u64,
) -> Result<u64> {
    require!(total_supply > 0, crate::ErrorCode::InvalidQuantity);
    
    if holder_balance == 0 {
        return Ok(0);
    }
    
    let share = (total_revenue as u128)
        .checked_mul(holder_balance as u128)
        .ok_or(crate::ErrorCode::Overflow)?
        .checked_div(total_supply as u128)
        .ok_or(crate::ErrorCode::Overflow)? as u64;
    
    Ok(share)
}
