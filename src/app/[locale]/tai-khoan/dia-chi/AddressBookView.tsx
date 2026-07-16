"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { PencilIcon, TrashIcon, XMarkIcon } from "@/components/icons";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PROVINCES, getWardsByProvinceCode } from "@/lib/vn-locations";
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
  type AddressInput,
} from "./actions";

type Address = AddressInput & { id: string };

function AddressFormModal({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Address | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("account");
  const tCheckout = useTranslations("checkout");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provinceCode, setProvinceCode] = useState(
    () => PROVINCES.find((p) => p.name === initial?.province)?.code ?? ""
  );
  const [wardCode, setWardCode] = useState(() => {
    const province = PROVINCES.find((p) => p.name === initial?.province);
    return province?.wards.find((w) => w.name === initial?.ward)?.code ?? "";
  });
  // New addresses default to domestic. Editing an existing one infers scope
  // from what was actually saved: a province means it was domestic (country
  // is always "Việt Nam" in that case, see actions.ts sanitizeAddressInput).
  const [isDomestic, setIsDomestic] = useState(
    () => !initial || Boolean(initial.province) || !initial.country || initial.country === "Việt Nam"
  );
  const [country, setCountry] = useState(() =>
    initial && !initial.province && initial.country && initial.country !== "Việt Nam" ? initial.country : ""
  );
  const skipNextWardReset = useRef(true);

  useEffect(() => {
    if (skipNextWardReset.current) {
      skipNextWardReset.current = false;
      return;
    }
    setWardCode("");
  }, [provinceCode]);

  const wards = provinceCode ? getWardsByProvinceCode(provinceCode) : [];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const input: AddressInput = {
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      company: String(formData.get("company") ?? ""),
      address: String(formData.get("address") ?? ""),
      isDomestic,
      province: PROVINCES.find((p) => p.code === provinceCode)?.name ?? "",
      ward: wards.find((w) => w.code === wardCode)?.name ?? "",
      country,
      zip: String(formData.get("zip") ?? ""),
      isDefault: formData.get("isDefault") === "on",
    };

    const result = initial
      ? await updateAddressAction(initial.id, input)
      : await createAddressAction(input);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    onSaved();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={initial ? t("addressModalEditTitle") : t("addressModalAddTitle")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="die-cut max-h-[90vh] w-full max-w-lg overflow-y-auto bg-paper p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg text-ink">
            {initial ? t("addressModalEditTitle") : t("addressModalAddTitle")}
          </h2>
          <button
            type="button"
            aria-label={tCheckout("removeItem")}
            onClick={onCancel}
            className="cursor-pointer text-graphite hover:text-ink"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <input
            name="fullName"
            required
            defaultValue={initial?.fullName}
            placeholder={tCheckout("name")}
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />
          <input
            name="phone"
            type="tel"
            required
            defaultValue={initial?.phone}
            placeholder={tCheckout("phone")}
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />
          <input
            name="company"
            defaultValue={initial?.company}
            placeholder={t("addressCompany")}
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />
          <div className="flex flex-wrap gap-2">
            <label className="flex cursor-pointer items-center gap-2 border border-graphite bg-paper px-3 py-2 text-sm text-ink has-[:checked]:border-forest has-[:checked]:bg-forest/10">
              <input
                type="radio"
                name="addressScope"
                checked={isDomestic}
                onChange={() => setIsDomestic(true)}
              />
              {tCheckout("shippingDomestic")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 border border-graphite bg-paper px-3 py-2 text-sm text-ink has-[:checked]:border-forest has-[:checked]:bg-forest/10">
              <input
                type="radio"
                name="addressScope"
                checked={!isDomestic}
                onChange={() => setIsDomestic(false)}
              />
              {tCheckout("shippingInternational")}
            </label>
          </div>

          {isDomestic ? (
            <>
              <input
                name="address"
                required
                defaultValue={initial?.address}
                placeholder={tCheckout("addressDetailPlaceholder")}
                className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SearchableSelect
                  id="dia-chi-province"
                  name="provinceCode"
                  value={provinceCode}
                  onChange={setProvinceCode}
                  options={PROVINCES}
                  placeholder={tCheckout("provincePlaceholder")}
                  searchPlaceholder={tCheckout("searchPlaceholder")}
                  emptyLabel={tCheckout("searchEmptyLabel")}
                  required
                />
                <SearchableSelect
                  id="dia-chi-ward"
                  name="wardCode"
                  value={wardCode}
                  onChange={setWardCode}
                  options={wards}
                  placeholder={tCheckout("wardPlaceholder")}
                  searchPlaceholder={tCheckout("searchPlaceholder")}
                  emptyLabel={tCheckout("searchEmptyLabel")}
                  disabled={!provinceCode}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <input
                name="country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={tCheckout("countryPlaceholder")}
                className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
              />
              <textarea
                name="address"
                required
                rows={3}
                defaultValue={initial?.address}
                placeholder={tCheckout("addressInternationalPlaceholder")}
                className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
              />
            </>
          )}

          <input
            name="zip"
            defaultValue={initial?.zip}
            placeholder={t("addressZip")}
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault} />
            {t("addressDefaultCheckbox")}
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-3 font-mono text-xs text-stamp">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="die-cut-flat cursor-pointer border border-graphite px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink hover:border-ink"
          >
            {t("addressCancel")}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? t("addressSaving") : initial ? t("addressSaveEdit") : t("addressSave")}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddressBookView({ addresses }: { addresses: Address[] }) {
  const t = useTranslations("account");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(addr: Address) {
    setEditing(addr);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("addressDeleteConfirm"))) return;
    await deleteAddressAction(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink">{t("addressesTitle")}</h2>
        <button
          type="button"
          onClick={openCreate}
          className="die-cut-flat cursor-pointer bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-ink-soft"
        >
          {t("addressAdd")}
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="die-cut-flat mt-4 bg-kraft p-6 text-center font-mono text-sm text-graphite">
          {t("addressEmpty")}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="die-cut flex flex-wrap items-start justify-between gap-3 bg-paper p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-body text-sm font-semibold text-ink">{addr.fullName}</p>
                  {addr.isDefault && (
                    <span className="bg-forest px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-paper">
                      {t("addressDefaultBadge")}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-graphite">{addr.phone}</p>
                {addr.company && <p className="font-mono text-xs text-graphite">{addr.company}</p>}
                <p className="mt-1 font-body text-sm text-ink">
                  {addr.province
                    ? [addr.address, addr.ward, addr.province].filter(Boolean).join(", ")
                    : [addr.address, addr.country].filter(Boolean).join(", ")}
                  {addr.zip ? ` (${addr.zip})` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefaultAddressAction(addr.id)}
                    className="cursor-pointer font-mono text-xs uppercase tracking-wide text-graphite hover:text-forest hover:underline"
                  >
                    {t("addressSetDefault")}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={t("addressEdit")}
                  onClick={() => openEdit(addr)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center text-graphite hover:text-ink"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("addressDelete")}
                  onClick={() => handleDelete(addr.id)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center text-graphite hover:text-stamp"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <AddressFormModal
          initial={editing}
          onCancel={() => setModalOpen(false)}
          onSaved={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
