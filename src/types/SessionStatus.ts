/**
 * @enum {number} SessionStatus
 * @description Represents the possible statuses of an Abstract Global Wallet session
 *
 * This enum maps to the SessionKeyPolicyRegistry.Status values.
 * It's used to determine if a session is valid and can be used to submit transactions on behalf of the wallet.
 */
enum SessionStatus {
  /**
   * Session has not been initialized or does not exist
   */
  NotInitialized = 0,

  /**
   * Session is active and can be used to submit transactions
   */
  Active = 1,

  /**
   * Session has been manually closed/revoked by the wallet owner
   */
  Closed = 2,

  /**
   * Session has expired (exceeded its expiresAt timestamp)
   */
  Expired = 3,
}

export default SessionStatus;
