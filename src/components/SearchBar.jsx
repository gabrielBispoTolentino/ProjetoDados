import React from 'react';
import './css/SearchBar.css';

export default function SearchBar({ value, onChange, sort, onSortChange, placeholder }) {
  return (
    <div className="searchbar-root">
      <input
        className="searchbar-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Pesquisar barbearias por nome...'}
        aria-label="Pesquisar barbearias"
      />

      <select
        className="searchbar-select"
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Ordenar lista"
      >
        <option value="relevance">Relevância</option>
        <option value="alpha-asc">Ordem alfabética (A → Z)</option>
        <option value="alpha-desc">Ordem alfabética (Z → A)</option>
        <option value="rating-desc">Avaliação (maior primeiro)</option>
        <option value="rating-asc">Avaliação (menor primeiro)</option>
        <option value="reviews-desc">Quantidade de avaliações (maior primeiro)</option>
        <option value="reviews-asc">Quantidade de avaliações (menor primeiro)</option>
      </select>
    </div>
  );
}
