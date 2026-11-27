import type { NotificationType } from "./enums";

// exactly one recipient (student or org); at most one sender
export type Notification = {
    notification_id: string;
    sender_student_id: string | null;
    sender_org_id: string | null;
    recipient_student_id: string | null;
    recipient_org_id: string | null;
    title: string;
    body: string;
    notification_type: NotificationType;
    created_at: string;
    read_at: string | null;
}
