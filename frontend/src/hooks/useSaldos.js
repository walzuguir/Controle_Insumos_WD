import { useState, useEffect } from 'react';
import api from '../services/api';

export function useSaldos() {
    const [saldos, setSaldos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const ehGestor = usuario?.filial_id === 'gestor';

        api.get('/saldos')
            .then(res => {
                let dados = res.data;
                if (!ehGestor) {
                    dados = dados.filter(s => s.filial_id === usuario.filial_id);
                }
                setSaldos(dados);
            })
            .catch(err => console.error('Erro ao buscar saldos:', err))
            .finally(() => setLoading(false));
    }, []);

    return { saldos, setSaldos, loading };
}