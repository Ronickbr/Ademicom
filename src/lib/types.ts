export type UserRole = 'TECNICO' | 'SUPERVISOR' | 'GESTOR' | 'ADMIN';

export interface Profile {
    id: string;
    full_name: string | null;
    role: UserRole;
    created_at?: string;
    updated_at?: string;
}

export interface TechnicalData {
    commercial_code?: string;
    color?: string;
    type?: string;
    pnc_ml?: string;
    manufacturing_date?: string;
    market_class?: string;
    gas_frigor?: string;
    gas_charge?: string;
    compressor?: string;
    vol_freezer?: string;
    vol_refrig?: string;
    vol_total?: string;
    pressure_kpa?: string;
    pressure_psig?: string;
    freezing_cap?: string;
    current?: string;
    defrost_power?: string;
    frequency?: string;
    [key: string]: string | undefined;
}

export interface Product {
    id: string;
    original_serial: string | null;
    serial?: string | null;
    internal_serial: string | null;
    brand: string | null;
    model: string | null;
    commercial_code: string | null;
    color: string | null;
    product_type: string | null;
    pnc_ml: string | null;
    manufacturing_date: string | null;
    market_class: string | null;
    refrigerant_gas: string | null;
    gas_charge: string | null;
    compressor: string | null;
    volume_freezer: string | null;
    volume_refrigerator: string | null;
    volume_total: string | null;
    pressure_high_low: string | null;
    freezing_capacity: string | null;
    electric_current: string | null;
    defrost_power: string | null;
    frequency: string | null;
    voltage: string | null;
    status: string;
    stock_status?: string | null;
    order_id?: string | null;
    is_in_stock: boolean;
    technical_data?: TechnicalData;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface ProductLog {
    id: string;
    product_id: string;
    user_id: string | null;
    old_status: string | null;
    new_status: string;
    checklist: Record<string, boolean> | null;
    notes: string | null;
    created_at: string;
    products?: Partial<Product>;
    data?: {
        checklist?: Record<string, boolean>;
        observations?: string;
        action?: string;
        reviewer_role?: string;
        timestamp?: string;
        manager_action?: string;
        release_timestamp?: string;
        final_decision?: string;
        [key: string]: unknown;
    };
}
export interface Client {
    id: string;
    name: string;
    tax_id: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    client_id: string;
    status: 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO';
    created_at: string;
    updated_at: string;
    clients?: {
        name: string;
    };
}
