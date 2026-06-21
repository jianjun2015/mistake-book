/**
 * 前端密码加密工具
 * 使用 Base64 编码对密码进行处理
 */

/**
 * 加密密码
 * 对密码进行 Base64 编码处理
 */
export function encryptPassword(password: string): string {
  // 使用 Base64 编码
  return btoa(password);
}

/**
 * 解密密码（用于调试）
 */
export function decryptPassword(encryptedPassword: string): string {
  return atob(encryptedPassword);
}
