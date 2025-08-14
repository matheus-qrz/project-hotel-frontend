import { cn } from "@/lib/utils"
import * as React from "react"

type InputType = React.HTMLInputTypeAttribute | "currency";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  currencyFormat?: Intl.NumberFormat;
  type?: InputType;
}

const defaultCurrencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});


const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, currencyFormat, onChange, onFocus, ...props }, ref) => {
    const isCurrency = type === "currency";
    const inputType = isCurrency ? "text" : type;

    const formatCurrency = (value: number) => {
      return (currencyFormat ?? defaultCurrencyFormat).format(value);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (isCurrency) {
        const target = e.currentTarget;
        target.setSelectionRange(target.value.length, target.value.length);
      }
      onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isCurrency) {
        const target = e.currentTarget;
        const raw = target.value.replace(/\D/g, "");

        // Permite apagar o valor sem formatar automaticamente
        if (raw === "") {
          target.value = "";
          onChange?.(e);
          return;
        }

        const numericValue = Number(raw) / 100;
        target.value = formatCurrency(numericValue);

        // Cria um novo evento para enviar o valor formatado corretamente ao React Hook Form
        const syntheticEvent = {
          ...e,
          currentTarget: {
            ...target,
            value: formatCurrency(numericValue),
          },
        };

        onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
        return;
      }

      onChange?.(e);
    };


    return (
      <input
        type={inputType}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        maxLength={isCurrency ? 22 : undefined}
        onFocus={handleFocus}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
