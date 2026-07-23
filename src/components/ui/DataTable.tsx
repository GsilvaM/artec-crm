import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { LoadingPanels } from "./Skeleton";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

// Tabela padrao para listagens paginadas por cursor (Clientes, Oportunidades e
// candidatos futuros): cabecalho + linhas tipadas, fallback de cards no mobile
// (.mobile-cards, ja usado em 4 telas) e "carregar mais" no rodape quando
// houver proxima pagina. Nao tenta ser um DataTable generico de ordenacao/
// selecao — o produto ainda nao tem uma tela que precise disso de verdade.
export function DataTable<T>({ columns, rows, rowKey, isLoading, emptyTitle, emptyText, hasMore, isLoadingMore, onLoadMore, loadMoreLabel = "Carregar mais" }: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading: boolean;
  emptyTitle: string;
  emptyText: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  loadMoreLabel?: string;
}) {
  if (isLoading) return <LoadingPanels />;
  if (!rows.length) return <EmptyState title={emptyTitle} text={emptyText} />;

  return (
    <>
      <div className="table-wrap mobile-cards">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.header} className={column.className}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore ? (
        <button className="button secondary" type="button" disabled={isLoadingMore} onClick={onLoadMore}>
          {isLoadingMore ? "Carregando..." : loadMoreLabel}
        </button>
      ) : null}
    </>
  );
}
