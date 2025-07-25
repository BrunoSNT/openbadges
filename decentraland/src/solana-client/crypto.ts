let nacl: any = null
let bs58: any = null
let base64js: any = null
let sha: any = null 
let solana: any = null 

export async function loadCryptoLibraries() {
  if (nacl && sha && bs58 && base64js && solana) return { nacl, sha, bs58, base64js, solana } // Already loaded
  
  try {
    console.log('🔍 Attempting to load crypto libraries from Decentraland ecosystem...')
    
    try {
      // @ts-ignore
      nacl = require('tweetnacl')
      console.log('✅ TweetNaCl loaded via require')
    } catch (e1) {
      console.log('⚠️ TweetNaCl not available:', e1)
      nacl = null
    }

    try {
      // @ts-ignore
      bs58 = require('bs58')
      console.log('✅ bs58 loaded via require')
    } catch (e2) {
      console.log('⚠️ bs58 not available:', e2)
    }

    try {
      // @ts-ignore
      base64js = require('base64-js')
      console.log('✅ base64-js loaded via require')
    } catch (e3) {
      console.log('⚠️ base64-js not available:', e3)
    }

    try{
      // @ts-ignore
      sha = require('sha.js')
      console.log('✅ sha.js loaded via require')
    } catch (e5) {
      console.log('⚠️ sha.js not available:', e5)
    }

    try{
      // @ts-ignore
      solana = require('@solana/web3.js')
      console.log('✅ solana loaded via require')
    } catch (e7) {
      console.log('⚠️ solana not available:', e7)
    }

    if (nacl && sha && bs58 && base64js && solana) {
      console.log('✅ Crypto libraries loaded successfully')
      return { nacl, sha, bs58, base64js, solana }
    } else {
      throw new Error('Critical libraries not loaded')
    }
  } catch (error) {
    console.log('⚠️ Crypto libraries not available:', error)
    return { nacl: null, sha: null, bs58: null, base64js: null, solana: null }
  }
}
