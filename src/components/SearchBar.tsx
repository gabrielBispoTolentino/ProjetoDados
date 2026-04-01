import './css/SearchBar.css';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchBar({
  value,
  onChange,
  sort,
  onSortChange,
  placeholder = 'Pesquisar barbearias por nome...',
}: SearchBarProps) {
  return (
    <div className="searchbar-root">
      <input
        className="searchbar-input"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Pesquisar barbearias"
      />

      <select
        className="searchbar-select"
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
        aria-label="Ordenar lista"
      >
        <option value="relevance">Relevancia</option>
        <option value="my-subscriptions">Minhas Assinaturas</option>
        <option value="alpha-asc">Ordem alfabetica (A - Z)</option>
        <option value="alpha-desc">Ordem alfabetica (Z - A)</option>
        <option value="rating-desc">Avaliacao (maior primeiro)</option>
        <option value="rating-asc">Avaliacao (menor primeiro)</option>
        <option value="reviews-desc">Quantidade de avaliacoes (maior primeiro)</option>
        <option value="reviews-asc">Quantidade de avaliacoes (menor primeiro)</option>
      </select>
    </div>
  );
}
