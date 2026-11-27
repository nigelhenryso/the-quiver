import type { College } from "./enums";

export type Student = {
    student_id: string;
    dlsu_id_no: string;
    first_name: string | null;
    last_name: string | null;
    personal_email: string | null;
    dlsu_email: string;
    contact_no: string | null;
    date_joined: string;
    college: College | null;
    birthday: string | null; // date
}
