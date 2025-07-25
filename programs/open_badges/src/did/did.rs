//! Integration with the official Identity.com sol-did program
//! 
//! This module provides functions to interact with the official did:sol implementation
//! using Cross-Program Invocation (CPI).

use anchor_lang::prelude::*;
use sol_did_cpi::cpi::accounts::{Initialize as SolDidInitialize, AddService as SolDidAddService};
use sol_did_cpi::cpi::{initialize as sol_did_initialize, add_service as sol_did_add_service};
use sol_did_cpi::program::SolDid;
use sol_did_cpi::{DidAccount, Service};

/// Initialize a DID document using the official sol-did program
pub fn create_did_document(
    ctx: &Context<'_, '_, '_, '_, CreateDidDocument>,
    size: u32,
) -> Result<()> {
    let cpi_program = ctx.accounts.sol_did_program.to_account_info();
    let cpi_accounts = SolDidInitialize {
        did_data: ctx.accounts.did_data.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    sol_did_initialize(cpi_ctx, size)
}

/// Add a service endpoint to a DID document
pub fn add_did_service(
    ctx: &Context<'_, '_, '_, '_, AddDidService>,
    service: Service,
) -> Result<()> {
    let cpi_program = ctx.accounts.sol_did_program.to_account_info();
    let cpi_accounts = SolDidAddService {
        did_data: ctx.accounts.did_data.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    sol_did_add_service(cpi_ctx, service, false, None)
}

/// Get the DID string from a DID account
pub fn get_did_from_account(did_account: &DidAccount) -> String {
    format!("did:sol:{}", did_account.native_controllers.first().unwrap())
}

/// Derive the DID account address for a given authority
pub fn derive_did_account_address(authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"did-account", authority.as_ref()],
        &sol_did_cpi::ID,
    )
}

#[derive(Accounts)]
pub struct CreateDidDocument<'info> {
    /// The DID account to initialize
    /// CHECK: This account is validated by the sol-did program during CPI call
    #[account(mut)]
    pub did_data: AccountInfo<'info>,
    
    /// The authority for the DID
    pub authority: Signer<'info>,
    
    /// The account paying for the transaction
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// The sol-did program
    pub sol_did_program: Program<'info, SolDid>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddDidService<'info> {
    /// The DID account to modify
    #[account(mut)]
    pub did_data: Account<'info, DidAccount>,
    
    /// The authority for the DID
    pub authority: Signer<'info>,
    
    /// The sol-did program
    pub sol_did_program: Program<'info, SolDid>,
}
