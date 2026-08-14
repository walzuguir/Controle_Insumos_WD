import { useState, useEffect } from 'react';
import api from '../services/api';

export function useInsumos() {
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/insumos')
            .then(res => setInsumos(res.data))
            .catch(err => console.error('Erro ao buscar insumos:', err))
            .finally(() => setLoading(false));
    }, []);

    return { insumos, setInsumos, loading };
}