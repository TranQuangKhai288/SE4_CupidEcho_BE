// Cấu hình kết nối database (Singleton)

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
class Database {
  private static instance: Database;

  private constructor() {
    mongoose.set("strictQuery", false);
    mongoose
      .connect(`${process.env.MONGO_DB}`)
      .then(() => {
        console.log("Connect Db success!");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

export default Database;
