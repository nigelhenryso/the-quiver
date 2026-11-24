export type Product = {
    product_id: string;
    organization_id: string;
    name: string;
    price: number;
    description: string | null;
    is_active: boolean;
    is_member_exclusive: boolean;
    cover_video_path: string | null;
    pickup_contact_person: string | null;
    pickup_contact_email: string | null;
    pickup_contact_number: string | null;
    pickup_social_url: string | null;
    preorder_start_date: string | null;
    preorder_end_date: string | null;
    created_at: string;
    updated_at: string;
}
