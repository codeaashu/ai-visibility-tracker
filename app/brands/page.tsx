'use client';

import { useEffect, useState } from 'react';
import { Brand } from '@/lib/types';
import { Plus, Trash2, Building2 } from 'lucide-react';

export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        website: '',
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const res = await fetch('/api/brands');
            const data = await res.json();
            setBrands(data.brands || []);
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setFormData({ name: '', category: '', website: '' });
                setShowForm(false);
                fetchBrands();
            }
        } catch (error) {
            console.error('Error creating brand:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this brand?')) return;

        try {
            const res = await fetch(`/api/brands/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchBrands();
            }
        } catch (error) {
            console.error('Error deleting brand:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Brands</h1>
                    <p className="text-slate-600">Manage the brands you want to track</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors shadow-lg"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add Brand</span>
                </button>
            </div>

            {/* Add Brand Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Add New Brand</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Brand Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., HubSpot"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., CRM"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Website
                            </label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                            >
                                Add Brand
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-6 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Brands Grid */}
            {brands.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
                    <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No brands yet</h3>
                    <p className="text-slate-600 mb-6">
                        Add your first brand to start tracking AI visibility
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl inline-flex items-center space-x-2 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Your First Brand</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brands.map((brand) => (
                        <div
                            key={brand.id}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-indigo-100 p-3 rounded-xl">
                                    <Building2 className="h-6 w-6 text-indigo-600" />
                                </div>
                                <button
                                    onClick={() => handleDelete(brand.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{brand.name}</h3>
                            {brand.category && (
                                <p className="text-sm text-slate-600 mb-2">
                                    <span className="bg-slate-100 px-2 py-1 rounded-md">{brand.category}</span>
                                </p>
                            )}
                            {brand.website && (
                                <a
                                    href={brand.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:text-indigo-700 truncate block"
                                >
                                    {brand.website}
                                </a>
                            )}
                            <p className="text-xs text-slate-500 mt-4">
                                Added {new Date(brand.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
