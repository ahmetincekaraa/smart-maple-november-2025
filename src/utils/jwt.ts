import jwt_decode from "jwt-decode";

class JWTToken {
  static getDecodeToken(token: string) {
    return jwt_decode(token);
  }

  static getExpiryTime(token: string) {
    var jwt: any = jwt_decode(token);
    return jwt.exp;
  }

  static isTokenExpired(token: string): boolean {
    var jwt: any = jwt_decode(token);
    const expiryTime: any = jwt.exp;
    if (expiryTime) {
      return 1000 * expiryTime - new Date().getTime() < 5000;
    } else {
      return false;
    }
  }
}

export default JWTToken;
