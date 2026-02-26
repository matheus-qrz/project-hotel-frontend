import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Extendendo o tipo de usuário
declare module "next-auth" {
    interface Session {
        token?: string;
        user: {
            id: string;
            role?: string;
            hotelId?: string;
            unitId?: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        id: string;
        role?: string;
        token?: string;
        hotelId?: string;
        unitId?: string;
    }
}

// Extendendo o JWT
declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        role?: string;
        token?: string;
        hotelId?: string;
        unitId?: string;
    }
}