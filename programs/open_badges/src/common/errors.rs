use anchor_lang::prelude::*;

#[error_code]
pub enum ValidationError {
    #[msg("Invalid JSON format")]
    InvalidJson,
    #[msg("Missing required field")]
    MissingRequiredField,
    #[msg("Invalid credential type")]
    InvalidCredentialType,
    #[msg("Invalid key format")]
    InvalidKey,
    #[msg("Invalid proof format")]
    InvalidProof,
    #[msg("Validation failed")]
    ValidationFailed,
    #[msg("Feature not implemented")]
    NotImplemented,
    #[msg("Unsupported format")]
    UnsupportedFormat,
    #[msg("Missing key fragment")]
    MissingKeyFragment,
    #[msg("Verification method not found")]
    VerificationMethodNotFound,
    #[msg("No public key found")]
    NoPublicKeyFound,
    #[msg("Unsupported key encoding")]
    UnsupportedKeyEncoding,
    #[msg("Unsupported key type")]
    UnsupportedKeyType,
    #[msg("Invalid Solana public key")]
    InvalidSolanaPublicKey,
    #[msg("Invalid key encoding")]
    InvalidKeyEncoding,
    #[msg("Invalid key length")]
    InvalidKeyLength,
    #[msg("Invalid DID")]
    InvalidDid,
    #[msg("Unsupported DID method")]
    UnsupportedDidMethod,
    #[msg("Invalid timestamp format")]
    InvalidTimestampFormat,
    #[msg("Serialization error")]
    SerializationError,
    #[msg("Invalid capacity value")]
    InvalidCapacity,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    #[msg("Index out of bounds")]
    IndexOutOfBounds,
    #[msg("Invalid encoded list")]
    InvalidEncodedList,
    #[msg("Invalid proof value")]
    InvalidProofValue,
    #[msg("Serialization failed")]
    SerializationFailed,
    #[msg("Invalid JWT format")]
    InvalidJwtFormat,
    #[msg("Invalid base64 encoding")]
    InvalidBase64Encoding,
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Batch size too large")]
    BatchSizeTooLarge,
    #[msg("Empty batch not allowed")]
    EmptyBatch,
    #[msg("Invalid batch signature length")]
    InvalidSignatureLength,
    #[msg("Invalid achievement ID format")]
    InvalidAchievementId,
}
