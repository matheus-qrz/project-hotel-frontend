"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, RefreshCw, Coffee, Utensils } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface TablesRequestingCheckoutProps {
  restaurantUnitId: string;
}

// Tipagem para mesa com pedidos
interface TableWithOrders {
  tableNumber: number;
  orderCount: number;
  total: number;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  paymentRequested: boolean;
}

export default function TablesRequestingCheckout({
  restaurantUnitId,
}: TablesRequestingCheckoutProps) {
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTable, setCurrentTable] = useState<TableWithOrders | null>(
    null,
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Função para carregar mesas com pedidos ativos
  const loadActiveOrders = async () => {
    try {
      setRefreshing(true);

      // 1. Buscar mesas solicitando pagamento
      const response = await fetch(
        `${API_URL}/restaurant/unit/${restaurantUnitId}/tables-checkout`,
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar mesas");
      }

      const data = await response.json();

      // 2. Para cada mesa, buscar detalhes dos pedidos
      const tablesWithOrders: TableWithOrders[] = [];

      for (const tableNumber of data.tables) {
        const tableOrdersResponse = await fetch(
          `${API_URL}/restaurant/unit/${restaurantUnitId}/table/${tableNumber}/orders`,
        );

        if (tableOrdersResponse.ok) {
          const tableData = await tableOrdersResponse.json();

          // Mapear dados para o formato da interface
          tablesWithOrders.push({
            tableNumber,
            orderCount: tableData.summary.orderCount,
            total: tableData.summary.total,
            items: tableData.orders.flatMap((order: any) => order.items),
            paymentRequested: tableData.summary.paymentRequested,
          });
        }
      }

      setTables(tablesWithOrders);
    } catch (error) {
      console.error("Erro ao carregar mesas com pedidos:", error);
      setError("Não foi possível carregar as mesas. Tente novamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadActiveOrders();

    // Configurar atualização periódica a cada 30 segundos
    const interval = setInterval(() => {
      loadActiveOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [restaurantUnitId]);

  // Função para processar pagamento
  const handleProcessPayment = async () => {
    if (!currentTable || !paymentMethod) return;

    setProcessingPayment(true);

    try {
      const response = await fetch(`${API_URL}/order/process-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantUnitId,
          tableNumber: currentTable.tableNumber,
          paymentMethod,
          // Normalmente aqui enviaria informações do staff atual (ID do usuário logado)
          staffId: "12345", // Placeholder - usar ID real do staff logado
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao processar pagamento");
      }

      // Fechar diálogo e atualizar lista de mesas
      setShowPaymentDialog(false);
      setCurrentTable(null);
      setPaymentMethod("");

      // Atualizar lista de mesas
      await loadActiveOrders();
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      setError("Não foi possível processar o pagamento. Tente novamente.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Carregar detalhes de uma mesa específica
  const handleViewTable = (tableNumber: number) => {
    const table = tables.find((t) => t.tableNumber === tableNumber);
    if (table) {
      setCurrentTable(table);
      setShowPaymentDialog(true);
    }
  };

  // Renderizar estado de carregamento
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mesas Aguardando Pagamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            <span>Mesas Aguardando Pagamento</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadActiveOrders()}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {tables.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Coffee
              className="mx-auto mb-3 text-gray-300"
              size={40}
            />
            <p>Não há mesas aguardando pagamento no momento.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mesa</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.tableNumber}>
                  <TableCell className="font-medium">
                    Mesa {table.tableNumber}
                  </TableCell>
                  <TableCell>{table.orderCount}</TableCell>
                  <TableCell>{formatCurrency(table.total)}</TableCell>
                  <TableCell>
                    {table.paymentRequested ? (
                      <Badge
                        variant="default"
                        className="bg-amber-500"
                      >
                        Aguardando pagamento
                      </Badge>
                    ) : (
                      <Badge variant="outline">Consumindo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTable(table.tableNumber)}
                    >
                      {table.paymentRequested
                        ? "Processar Pagamento"
                        : "Ver Detalhes"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Diálogo de pagamento */}
        <Dialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Mesa {currentTable?.tableNumber} -{" "}
                {formatCurrency(currentTable?.total || 0)}
              </DialogTitle>
              <DialogDescription>
                {currentTable?.paymentRequested
                  ? "Cliente solicitou fechamento da conta. Processe o pagamento."
                  : "Detalhes do consumo da mesa."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <h3 className="mb-2 flex items-center font-medium">
                <Utensils className="mr-2 h-4 w-4" />
                Itens Consumidos
              </h3>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTable?.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {currentTable?.paymentRequested && (
                <div className="mt-6">
                  <Label htmlFor="payment-method">Método de Pagamento</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger
                      id="payment-method"
                      className="mt-1"
                    >
                      <SelectValue placeholder="Selecione o método de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancelar
              </Button>

              {currentTable?.paymentRequested && (
                <Button
                  onClick={handleProcessPayment}
                  disabled={!paymentMethod || processingPayment}
                >
                  {processingPayment ? "Processando..." : "Confirmar Pagamento"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
