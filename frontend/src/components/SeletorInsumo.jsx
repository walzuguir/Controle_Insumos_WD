import Select from 'react-select';

const estilosTema = {
  control: (base, state) => ({
    ...base,
    background: 'var(--cor-superficie-2)',
    borderColor: state.isFocused ? 'var(--cor-destaque)' : 'var(--cor-borda)',
    boxShadow: 'none',
    minWidth: '200px',
    width: '100%',
    '&:hover': { borderColor: 'var(--cor-destaque)' },
  }),
  singleValue: (base) => ({ ...base, color: 'var(--cor-texto)' }),
  input: (base) => ({ ...base, color: 'var(--cor-texto)' }),
  placeholder: (base) => ({ ...base, color: 'var(--cor-texto-suave)' }),
  menu: (base) => ({ ...base, background: 'var(--cor-superficie-2)', border: '1px solid var(--cor-borda)' }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'var(--cor-destaque)' : 'transparent',
    color: state.isFocused ? '#fff' : 'var(--cor-texto)',
    cursor: 'pointer',
  }),
};

export default function SeletorInsumo({ insumos, valor, onChange, placeholder = "Selecione o insumo..." }) {
  const opcoes = [...insumos]
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((i) => ({ value: i.id, label: i.nome }));

  const opcaoSelecionada = opcoes.find((o) => o.value === valor) || null;

  return (
    <Select
      options={opcoes}
      value={opcaoSelecionada}
      onChange={(opcao) => onChange(opcao ? opcao.value : '')}
      placeholder={placeholder}
      isClearable
      noOptionsMessage={() => "Nenhum insumo encontrado"}
      styles={estilosTema}
    />
  );
}