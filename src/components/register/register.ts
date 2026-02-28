// components/register/register.types.ts

import React from "react";

// ── Aligned with IUser (User.ts) ─────────────────────────────────────────────
export interface OwnerForm {
  firstName:       string;
  lastName:        string;
  cpf:             string;   // sent as digits (no mask) to backend
  email:           string;
  phone:           string;   // sent as digits (no mask) to backend
  password:        string;
  confirmPassword: string;   // frontend-only validation, not sent
}

// ── Aligned with IHotel (Hotel.ts) + RegisterAdminWithHotelPayload (authStore) ──
// Note: `cnpj` and `type` are not in IHotel yet but are expected by the form.
// They are included in the payload for forward-compatibility.
// `neighborhood` and `complement` are also not in IHotel.address but are
// accepted gracefully by the backend and useful for the user.
export interface HotelForm {
  name:         string;
  type:         string;   // not in IHotel — forward-compat, send as description prefix
  cnpj:         string;   // not in IHotel — forward-compat field
  // contact (maps to IHotel.contact)
  phone:        string;
  email:        string;
  // address (maps to IHotel.address)
  street:       string;
  number:       string;
  complement:   string;  // not in IHotel.address, sent anyway
  neighborhood: string;  // not in IHotel.address, sent anyway
  city:         string;
  state:        string;
  zipCode:      string;
}

export type RegisterErrors = Record<string, string>;

// ── Establishment types ───────────────────────────────────────────────────────
export const HOTEL_TYPES = [
  { value: "hotel",     label: "Hotel"     },
  { value: "motel",     label: "Motel"     },
  { value: "pousada",   label: "Pousada"   },
  { value: "estalagem", label: "Estalagem" },
  { value: "hostel",    label: "Hostel"    },
  { value: "resort",    label: "Resort"    },
] as const;

export const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
] as const;

// ── Payload aligned with RegisterAdminWithHotelPayload in authStore.ts ────────
// authStore.registerAdminWithHotel() sends this shape to POST /hotel/create
// which is handled by HotelController.registerAdminWithHotel()
export function buildRegisterPayload(owner: OwnerForm, hotel: HotelForm) {
  const typeLabel = HOTEL_TYPES.find(t => t.value === hotel.type)?.label ?? hotel.type;

  return {
    // ── User fields (flat, as expected by HotelController) ──
    firstName: owner.firstName,
    lastName:  owner.lastName,
    cpf:       owner.cpf.replace(/\D/g, ""),
    email:     owner.email,
    phone:     owner.phone.replace(/\D/g, ""),
    password:  owner.password,

    // ── Hotel fields (flat, as expected by HotelController) ──
    name: hotel.name,

    // `description` encodes the establishment type since IHotel has no `type` field yet
    description: typeLabel,

    // `logo` will be handled separately (upload) — empty string for now
    logo: "",

    // address shape matches IHotel.address
    address: {
      street:   hotel.street,
      number:   hotel.number,
      city:     hotel.city,
      state:    hotel.state,
      zipCode:  hotel.zipCode.replace(/\D/g, ""),
      // extra fields (backend ignores gracefully)
      complement:   hotel.complement,
      neighborhood: hotel.neighborhood,
    },

    // contact shape matches IHotel.contact
    contact: {
      phone: hotel.phone.replace(/\D/g, ""),
      email: hotel.email || owner.email,
    },
  };
}

// ── Input masks ───────────────────────────────────────────────────────────────
export function formatCPF(v: string) {
  return v.replace(/\D/g,"").slice(0,11)
    .replace(/(\d{3})(\d)/,"$1.$2")
    .replace(/(\d{3})(\d)/,"$1.$2")
    .replace(/(\d{3})(\d{1,2})$/,"$1-$2");
}

export function formatCNPJ(v: string) {
  return v.replace(/\D/g,"").slice(0,14)
    .replace(/(\d{2})(\d)/,"$1.$2")
    .replace(/(\d{3})(\d)/,"$1.$2")
    .replace(/(\d{3})(\d)/,"$1/$2")
    .replace(/(\d{4})(\d{1,2})$/,"$1-$2");
}

export function formatPhone(v: string) {
  const d = v.replace(/\D/g,"").slice(0,11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/,"($1) $2-$3");
}

export function formatCEP(v: string) {
  return v.replace(/\D/g,"").slice(0,8).replace(/(\d{5})(\d{0,3})/,"$1-$2");
}

// ── Shared input style ────────────────────────────────────────────────────────
export const INPUT_STYLE: React.CSSProperties = {
  background:  "#1A1A1A",
  borderColor: "rgba(201,169,110,0.2)",
  color:       "#F0EDE8",
  height:      "2.75rem",
};