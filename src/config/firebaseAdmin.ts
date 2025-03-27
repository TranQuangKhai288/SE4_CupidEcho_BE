import * as admin from "firebase-admin";
import * as path from "path";

class FirebaseAdmin {
  private static instance: any = null;

  public static initialize(): admin.app.App {
    if (!FirebaseAdmin.instance) {
      try {
        FirebaseAdmin.instance = admin.initializeApp({
          credential: admin.credential.cert(
            path.resolve(__dirname, "../../firebaseAdmin.json")
          ),
        });
        console.log("Khởi tạo Firebase Admin thành công");
      } catch (error) {
        console.error("Lỗi khi khởi tạo Firebase Admin:", error);
        // Không thoát ứng dụng, chỉ log lỗi
      }
    }
    return FirebaseAdmin.instance;
  }

  public static getInstance(): admin.app.App | null {
    return FirebaseAdmin.instance;
  }
}

export default FirebaseAdmin;
