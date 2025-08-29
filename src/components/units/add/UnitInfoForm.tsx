import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidCnpj } from "@/utils/formatCnpj";
import { useToast } from "@/hooks/useToast";
import { useRestaurantUnitFormStore } from "@/stores";

export default function UnitInfoForm() {
  const { unitData, updateUnitData } = useRestaurantUnitFormStore();
  const toast = useToast();

  const handleCnpjPart1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    updateUnitData({ cnpjPart1: value });
  };

  const handleCnpjPart2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    updateUnitData({ cnpjPart2: value });
  };

  const handleCnpjPart3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    updateUnitData({ cnpjPart3: value });
  };

  const validateCNPJ = (cnpj: string) => {
    return isValidCnpj(cnpj); // Substituir por validação real
  };

  const handleCheckboxChange = (checked: boolean) => {
    updateUnitData({ useMatrixCNPJ: checked });
    if (checked) {
      const cnpj =
        `${unitData.cnpjPart1}${unitData.cnpjPart2}${unitData.cnpjPart3}`.replace(
          /\D/g,
          "",
        );

      const formattedCNPJ = cnpj.replace(/[^\d]/g, "");
      if (formattedCNPJ.length >= 14) {
        const part1 = formattedCNPJ.substring(0, 8);
        const part2 = formattedCNPJ.substring(8, 12);
        const part3 = formattedCNPJ.substring(12, 14);
        updateUnitData({
          cnpjPart1: part1,
          cnpjPart2: part2,
          cnpjPart3: part3,
        });
      }
    } else {
      updateUnitData({ cnpjPart1: "", cnpjPart2: "", cnpjPart3: "" });
    }
  };

  const specialties = [
    { value: "acai", label: "Açaí" },
    { value: "pizza", label: "Pizza" },
    { value: "hamburger", label: "Hamburger" },
    { value: "japanese", label: "Japonesa" },
    { value: "brazilian", label: "Brasileira" },
    { value: "italian", label: "Italiana" },
  ];

  return (
    <div className="flex w-full flex-col space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium">Informações da unidade</h2>
        <p className="mb-4 text-sm text-gray-500">
          Informe os dados do seu negócio.
        </p>
      </div>

      <div className="space-y-4">
        {/* Linha 1: CNPJ + Razão social */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="cnpj-part1"
              className="py-2 text-base font-semibold md:text-lg"
            >
              CNPJ
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="cnpj-part1"
                value={unitData.cnpjPart1}
                onChange={handleCnpjPart1Change}
                placeholder="12.345.678"
                className="h-10 min-w-[140px] flex-1"
              />
              <span className="text-lg">/</span>
              <Input
                id="cnpj-part2"
                value={unitData.cnpjPart2}
                onChange={handleCnpjPart2Change}
                placeholder="0001"
                className="h-10 w-24 md:w-28"
              />
              <span className="text-lg">-</span>
              <Input
                id="cnpj-part3"
                value={unitData.cnpjPart3}
                onChange={handleCnpjPart3Change}
                placeholder="90"
                className="h-10 w-16"
              />
            </div>
            <div className="flex items-center gap-2 py-2">
              <Checkbox
                checked={unitData.useMatrixCNPJ}
                onCheckedChange={handleCheckboxChange}
              />
              <Label
                htmlFor="matrix-cnpj"
                className="text-sm"
              >
                CNPJ baseado na matriz
              </Label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="socialName"
              className="py-2 text-base font-semibold md:text-lg"
            >
              Razão social
            </Label>
            <Input
              id="socialName"
              value={unitData.socialName}
              onChange={(e) => updateUnitData({ socialName: e.target.value })}
              placeholder="Informe a razão social da loja"
              className="h-10"
            />
          </div>
        </div>

        {/* Linha 2: Nome / Telefone / Especialidade */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label
              htmlFor="unitName"
              className="mb-2 block"
            >
              Nome da unidade
            </Label>
            <Input
              id="unitName"
              value={unitData.name}
              onChange={(e) => updateUnitData({ name: e.target.value })}
              placeholder="Exemplo: Lanchonete do Bio"
              className="h-10"
            />
          </div>
          <div>
            <Label
              htmlFor="phone"
              className="mb-2 block"
            >
              Telefone ou celular
            </Label>
            <Input
              id="phone"
              value={unitData.phone}
              onChange={(e) => updateUnitData({ phone: e.target.value })}
              placeholder="Número de telefone ou celular da unidade"
              className="h-10"
            />
          </div>
          <div>
            <Label
              htmlFor="specialty"
              className="mb-2 block"
            >
              Especialidade
            </Label>
            <Select
              value={unitData.specialty}
              onValueChange={(v) => updateUnitData({ specialty: v })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Açaí" />
              </SelectTrigger>
              <SelectContent>{/* ...mesma lista... */}</SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
