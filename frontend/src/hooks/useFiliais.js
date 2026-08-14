import { useState, useEffect } from 'react';
import api from '../services/api';

export function useFiliais() {
    const [filiais, setFiliais] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/filiais')
            .then(res => setFiliais(res.data))
            .catch(err => console.error('Erro ao buscar filiais:', err))
            .finally(() => setLoading(false));
    }, []);

    return { filiais, setFiliais, loading };
}