// app/restaurant/[restaurantId]/products/import/page.tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Upload,
    FileText,
    CheckCircle,
    XCircle,
    Download,
    Info
} from 'lucide-react';
import { useProductStore } from '@/stores';

interface ValidationError {
    message: string;
    row?: number;
    field?: string;
}

interface CsvRow {
    name: string;
    price: string;
    category: string;
    description?: string;
    image?: string;
    quantity?: string;
    isAvailable?: string;
    [key: string]: string | undefined;
}

export default function ImportProducts() {
    const params = useParams();
    const router = useRouter();
    const { importProducts } = useProductStore();
    const restaurantId = params.restaurantId as string;

    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<CsvRow[]>([]);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const selectedFile = selectedFiles[0];
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setUploadError(null);

        // Simulando parse de CSV
        // Em produção, use PapaParse ou outra biblioteca CSV
        setTimeout(() => {
            // Dados simulados para preview
            setPreviewData([
                {
                    name: "X-Burger",
                    price: "25.90",
                    category: "Hambúrgueres",
                    description: "Hambúrguer com queijo",
                    image: "/burger.jpg",
                    quantity: "100",
                    isAvailable: "true"
                },
                {
                    name: "Batata Frita",
                    price: "15.90",
                    category: "Acompanhamentos",
                    description: "Porção de batatas fritas",
                    image: "",
                    quantity: "150",
                    isAvailable: "true"
                }
            ]);

            // Validação simulada
            setValidationErrors([]);
        }, 500);
    };

    const handleSubmit = async () => {
        if (!file) {
            setUploadError('Por favor, selecione um arquivo para enviar.');
            return;
        }

        if (validationErrors.length > 0) {
            setUploadError('Corrija os erros de validação antes de enviar.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const result = await importProducts(file, restaurantId);

            if (result.success) {
                setUploadSuccess(true);

                setTimeout(() => {
                    router.push(`/restaurant/${restaurantId}/products`);
                })
            } else {
                setUploadError(result.message)
            }
        } catch (err) {
            setUploadError((err as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        // Criar conteúdo CSV de exemplo
        const csvContent = [
            ['name', 'price', 'category', 'description', 'image', 'quantity', 'isAvailable'].join(','),
            ['X-Burger', '25.90', 'Hambúrgueres', 'Hambúrguer com queijo', 'https://exemplo.com/imagem.jpg', '100', 'true'].join(','),
            ['Batata Frita', '15.90', 'Acompanhamentos', 'Porção de batatas fritas', '', '150', 'true'].join(',')
        ].join('\n');

        // Criar um blob e link para download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template_produtos.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="flex flex-col">

            <div className="bg-white border rounded-lg p-6 max-w-3xl mx-auto w-full">
                <h2 className="text-lg font-semibold mb-4">Importação em Massa</h2>

                {/* Instructions */}
                <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-md">
                    <div className="flex">
                        <Info size={20} className="text-blue-600 mr-2 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-blue-800 font-medium">Instruções para importação</h3>
                            <p className="text-blue-700 text-sm mt-1">
                                Faça upload de um arquivo CSV com os produtos a serem importados. O arquivo deve conter as seguintes colunas:
                            </p>
                            <ul className="text-blue-700 text-sm list-disc pl-5 mt-2">
                                <li><strong>name</strong> (obrigatório): Nome do produto</li>
                                <li><strong>price</strong> (obrigatório): Preço em formato numérico (ex: 25.90)</li>
                                <li><strong>category</strong> (obrigatório): Categoria do produto</li>
                                <li><strong>description</strong> (opcional): Descrição do produto</li>
                                <li><strong>image</strong> (opcional): URL da imagem do produto</li>
                                <li><strong>quantity</strong> (opcional): Quantidade em estoque</li>
                                <li><strong>isAvailable</strong> (opcional): "true" se disponível, "false" se indisponível</li>
                            </ul>
                            <div className="mt-3">
                                <button
                                    onClick={downloadTemplate}
                                    className="text-blue-700 underline flex items-center text-sm"
                                >
                                    <Download size={16} className="mr-1" />
                                    Baixar arquivo modelo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecionar arquivo CSV
                    </label>
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div className="flex items-center justify-center">
                                <FileText size={24} className="text-green-600 mr-2" />
                                <span className="text-green-700">{fileName}</span>
                            </div>
                        ) : (
                            <div>
                                <Upload size={36} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-500">Clique para selecionar ou arraste um arquivo CSV</p>
                                <p className="text-gray-400 text-sm mt-1">Somente arquivos .csv são aceitos</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* File Preview */}
                {previewData.length > 0 && validationErrors.length === 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Prévia (primeiras 5 linhas)
                        </h3>
                        <div className="border rounded-md overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {Object.keys(previewData[0]).map((key) => (
                                            <th
                                                key={key}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((cell, j) => (
                                                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Upload Status */}
                {uploadError && (
                    <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-md flex items-start">
                        <XCircle size={20} className="text-red-600 mr-2 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-red-800 font-medium">Erro na importação</h3>
                            <p className="text-red-700 text-sm mt-1">{uploadError}</p>
                        </div>
                    </div>
                )}

                {uploadSuccess && (
                    <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-md flex items-start">
                        <CheckCircle size={20} className="text-green-600 mr-2 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-green-800 font-medium">Importação concluída com sucesso!</h3>
                            <p className="text-green-700 text-sm mt-1">
                                Os produtos foram importados. Redirecionando para a lista de produtos...
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 border rounded-md"
                        type="button"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || validationErrors.length > 0 || isUploading || uploadSuccess}
                        className={`px-4 py-2 rounded-md flex items-center ${!file || validationErrors.length > 0 || isUploading || uploadSuccess
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                            : 'bg-blue-600 text-white'
                            }`}
                        type="button"
                    >
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                                Enviando...
                            </>
                        ) : (
                            'Importar Produtos'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}