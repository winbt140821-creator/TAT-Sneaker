import { SelectField } from "./SelectField";
import type { Department } from "@/lib/inventory";

// Which store a piece of content belongs to — news, reviews, content pages,
// social links. `allowBoth` adds "Cả hai cửa hàng" (submitted as "") for
// rows that can be shared.
export function StoreField({
  id = "department",
  name = "department",
  label = "Cửa hàng",
  defaultValue,
  allowBoth = false,
  className,
}: {
  id?: string;
  name?: string;
  label?: string;
  defaultValue: Department | null;
  allowBoth?: boolean;
  className?: string;
}) {
  return (
    <SelectField id={id} name={name} label={label} defaultValue={defaultValue ?? ""} className={className}>
      {allowBoth && <option value="">Cả hai cửa hàng</option>}
      <option value="SHOES">Giày</option>
      <option value="CLOTHING">Quần áo</option>
    </SelectField>
  );
}
