import React, { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { apiClient, ApiClientError } from '../api/client';
import { Vehicle, VEHICLE_CATEGORIES } from '../types/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { formatPrice } from '../utils/format';

export const AdminPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form modal state (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formValues, setFormValues] = useState({
    make: '',
    model: '',
    year: '2024',
    category: 'Sedan',
    price: '',
    quantityInStock: '1',
    description: '',
    imageUrl: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  // Restock modal state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockVehicle, setRestockVehicle] = useState<Vehicle | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<string>('5');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState<boolean>(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPaginated<Vehicle>('/vehicles', {
        params: { page: 1, limit: 50 },
      });
      setVehicles(response.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to load inventory ledger.');
      } else {
        setError('A network or server error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Open Create Form
  const handleOpenCreateModal = () => {
    setEditingVehicle(null);
    setFormValues({
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      category: 'Sedan',
      price: '',
      quantityInStock: '1',
      description: '',
      imageUrl: '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormValues({
      make: vehicle.make,
      model: vehicle.model,
      year: (vehicle.year || new Date().getFullYear()).toString(),
      category: vehicle.category,
      price: vehicle.price.toString(),
      quantityInStock: vehicle.quantityInStock.toString(),
      description: vehicle.description || '',
      imageUrl: vehicle.imageUrl || '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formValues.make.trim()) errors.make = 'Vehicle make is required';
    if (!formValues.model.trim()) errors.model = 'Vehicle model is required';
    if (!formValues.category) errors.category = 'Vehicle category is required';

    const priceNum = Number(formValues.price);
    if (!formValues.price || isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be greater than zero';
    }

    const qtyNum = Number(formValues.quantityInStock);
    if (
      formValues.quantityInStock === '' ||
      isNaN(qtyNum) ||
      qtyNum < 0 ||
      !Number.isInteger(qtyNum)
    ) {
      errors.quantityInStock = 'Quantity in stock must be a non-negative integer';
    }

    if (formValues.year) {
      const yearNum = Number(formValues.year);
      if (isNaN(yearNum) || yearNum < 1900 || !Number.isInteger(yearNum)) {
        errors.year = 'Year must be 1900 or later';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmittingForm(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      make: formValues.make.trim(),
      model: formValues.model.trim(),
      category: formValues.category,
      price: Number(formValues.price),
      quantityInStock: Number(formValues.quantityInStock),
      year: formValues.year ? Number(formValues.year) : undefined,
      description: formValues.description.trim() || undefined,
      imageUrl: formValues.imageUrl.trim() || undefined,
    };

    try {
      if (editingVehicle) {
        const response = await apiClient.put<{ data: Vehicle } | Vehicle>(
          `/vehicles/${editingVehicle._id}`,
          payload,
        );
        const updated = (response as { data?: Vehicle })?.data || (response as Vehicle);
        setVehicles(prev =>
          prev.map(v => (v._id === editingVehicle._id ? { ...v, ...updated } : v)),
        );
        setSuccessMessage(`Vehicle updated successfully: ${payload.make} ${payload.model}.`);
      } else {
        const response = await apiClient.post<{ data: Vehicle } | Vehicle>('/vehicles', payload);
        const created = (response as { data?: Vehicle })?.data || (response as Vehicle);
        setVehicles(prev => [created, ...prev]);
        setSuccessMessage(`Vehicle created successfully: ${payload.make} ${payload.model}.`);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to save vehicle.');
      } else {
        setError('A network error occurred while saving the vehicle.');
      }
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Open Restock
  const handleOpenRestockModal = (vehicle: Vehicle) => {
    setRestockVehicle(vehicle);
    setRestockQuantity('5');
    setIsRestockModalOpen(true);
  };

  // Submit Restock
  const handleSubmitRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockVehicle) return;

    const qty = Number(restockQuantity);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      setError('Restock quantity must be a positive integer.');
      return;
    }

    setIsSubmittingRestock(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post<{ data: Vehicle } | Vehicle>(
        `/vehicles/${restockVehicle._id}/restock`,
        { quantity: qty },
      );
      const updated = (response as { data?: Vehicle })?.data || (response as Vehicle);
      setVehicles(prev =>
        prev.map(v =>
          v._id === restockVehicle._id
            ? { ...v, quantityInStock: updated.quantityInStock ?? v.quantityInStock + qty }
            : v,
        ),
      );
      setSuccessMessage(
        `Successfully restocked ${qty} units of ${restockVehicle.make} ${restockVehicle.model}.`,
      );
      setIsRestockModalOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to restock vehicle.');
      } else {
        setError('A network error occurred while restocking.');
      }
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Open Delete
  const handleOpenDeleteModal = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteModalOpen(true);
  };

  // Submit Delete
  const handleSubmitDelete = async () => {
    if (!vehicleToDelete) return;

    setIsSubmittingDelete(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.delete(`/vehicles/${vehicleToDelete._id}`);
      setVehicles(prev => prev.filter(v => v._id !== vehicleToDelete._id));
      setSuccessMessage(
        `Vehicle deleted successfully: ${vehicleToDelete.make} ${vehicleToDelete.model}.`,
      );
      setIsDeleteModalOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to delete vehicle.');
      } else {
        setError('A network error occurred while deleting the vehicle.');
      }
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Title and Add Button */}
        <header className="border-b border-surface-border pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-forest-700">
              Dealership Administration
            </span>
            <h1
              data-testid="admin-heading"
              className="text-3xl font-extrabold tracking-tight text-charcoal-primary mt-1"
            >
              Inventory Operations & Fleet Ledger
            </h1>
            <p className="text-sm text-charcoal-secondary mt-1">
              Authorized interface for vehicle provisioning, pricing adjustments, and inventory
              replenishment.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            className="shrink-0 text-sm shadow-xs"
          >
            + Add New Vehicle
          </Button>
        </header>

        {/* Feedback Banners */}
        {error && (
          <Alert variant="error" title="Ledger Alert">
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert
            variant="success"
            title="Operation Complete"
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {/* Ledger Table */}
        <div className="rounded-xl border border-surface-border bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-charcoal-primary">
              <thead className="bg-surface-muted border-b border-surface-border text-xs uppercase font-semibold tracking-wider text-charcoal-secondary">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Vehicle
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Stock Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-charcoal-muted">
                      Loading vehicle inventory ledger...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-charcoal-muted">
                      No vehicles found in ledger. Click &ldquo;+ Add New Vehicle&rdquo; to
                      provision inventory.
                    </td>
                  </tr>
                ) : (
                  vehicles.map(v => (
                    <tr key={v._id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-charcoal-primary">
                          {v.make} {v.model}
                        </div>
                        <div className="text-xs text-charcoal-muted font-mono">
                          Year: {v.year || 'N/A'} • ID: {v._id.slice(-6)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-surface-muted text-charcoal-secondary border border-surface-border">
                          {v.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold">{formatPrice(v.price)}</td>
                      <td className="px-6 py-4">
                        {v.quantityInStock === 0 ? (
                          <Badge variant="out-of-stock">Out of Stock</Badge>
                        ) : v.quantityInStock <= 2 ? (
                          <Badge variant="low-stock">{v.quantityInStock} units remaining</Badge>
                        ) : (
                          <Badge variant="in-stock">{v.quantityInStock} units in stock</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(v)}
                            className="text-xs px-2.5 py-1"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenRestockModal(v)}
                            className="text-xs px-2.5 py-1"
                          >
                            Restock
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenDeleteModal(v)}
                            className="text-xs px-2.5 py-1"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal Dialog */}
        <Dialog.Root open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-charcoal-primary/40 backdrop-blur-xs z-40 transition-opacity" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between border-b border-surface-border pb-4">
                <div>
                  <Dialog.Title className="text-xl font-bold text-charcoal-primary">
                    {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-charcoal-secondary mt-1">
                    {editingVehicle
                      ? 'Modify existing vehicle pricing, specifications, and attributes.'
                      : 'Provision a new vehicle entry into the active dealership catalog.'}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm" className="p-1 text-charcoal-muted">
                    ✕
                  </Button>
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Vehicle Make"
                    id="make"
                    value={formValues.make}
                    onChange={e => setFormValues({ ...formValues, make: e.target.value })}
                    error={formErrors.make}
                    placeholder="e.g. Porsche"
                    required
                  />
                  <Input
                    label="Vehicle Model"
                    id="model"
                    value={formValues.model}
                    onChange={e => setFormValues({ ...formValues, model: e.target.value })}
                    error={formErrors.model}
                    placeholder="e.g. 911 GT3"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="category"
                      className="block text-xs font-semibold uppercase tracking-wide text-charcoal-primary"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      aria-label="Category"
                      value={formValues.category}
                      onChange={e => setFormValues({ ...formValues, category: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-md border border-surface-border bg-white text-charcoal-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                    >
                      {VEHICLE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Model Year"
                    id="year"
                    type="number"
                    min="1900"
                    value={formValues.year}
                    onChange={e => setFormValues({ ...formValues, year: e.target.value })}
                    error={formErrors.year}
                  />

                  <Input
                    label="Price ($)"
                    id="price"
                    type="number"
                    min="1"
                    value={formValues.price}
                    onChange={e => setFormValues({ ...formValues, price: e.target.value })}
                    error={formErrors.price}
                    placeholder="e.g. 175000"
                    required
                  />
                </div>

                <Input
                  label="Quantity in Stock"
                  id="quantityInStock"
                  type="number"
                  min="0"
                  value={formValues.quantityInStock}
                  onChange={e => setFormValues({ ...formValues, quantityInStock: e.target.value })}
                  error={formErrors.quantityInStock}
                  required
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="description"
                    className="block text-xs font-semibold uppercase tracking-wide text-charcoal-primary"
                  >
                    Vehicle Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formValues.description}
                    onChange={e => setFormValues({ ...formValues, description: e.target.value })}
                    placeholder="Provide performance details, optional packages, or luxury amenities..."
                    className="w-full px-3.5 py-2 text-sm rounded-md border border-surface-border bg-white text-charcoal-primary placeholder:text-charcoal-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                  />
                </div>

                <Input
                  label="Image Asset URL"
                  id="imageUrl"
                  value={formValues.imageUrl}
                  onChange={e => setFormValues({ ...formValues, imageUrl: e.target.value })}
                  placeholder="https://..."
                />

                <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="outline" size="md">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" variant="primary" size="md" loading={isSubmittingForm}>
                    {editingVehicle ? 'Save Changes' : 'Create Vehicle'}
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Restock Modal Dialog */}
        <Dialog.Root open={isRestockModalOpen} onOpenChange={setIsRestockModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-charcoal-primary/40 backdrop-blur-xs z-40 transition-opacity" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 space-y-6">
              <div className="border-b border-surface-border pb-4">
                <Dialog.Title className="text-xl font-bold text-charcoal-primary">
                  Restock Inventory
                </Dialog.Title>
                <Dialog.Description className="text-xs text-charcoal-secondary mt-1">
                  Replenish active inventory for {restockVehicle?.make} {restockVehicle?.model}.
                  Current stock: {restockVehicle?.quantityInStock} units.
                </Dialog.Description>
              </div>

              <form onSubmit={handleSubmitRestock} className="space-y-4">
                <Input
                  label="Restock Quantity"
                  id="restockQuantity"
                  type="number"
                  min="1"
                  max="10000"
                  value={restockQuantity}
                  onChange={e => setRestockQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  required
                />

                <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="outline" size="md">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" variant="primary" size="md" loading={isSubmittingRestock}>
                    Confirm Restock
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Delete Confirmation Dialog */}
        <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-charcoal-primary/40 backdrop-blur-xs z-40 transition-opacity" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 space-y-6">
              <div className="border-b border-surface-border pb-4">
                <Dialog.Title className="text-xl font-bold text-rose-700">
                  Delete Vehicle
                </Dialog.Title>
                <Dialog.Description className="text-xs text-charcoal-secondary mt-2 leading-relaxed">
                  Are you sure you want to delete {vehicleToDelete?.make} {vehicleToDelete?.model}?
                  This action cannot be undone and will permanently remove this record from the
                  catalog.
                </Dialog.Description>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Dialog.Close asChild>
                  <Button variant="outline" size="md">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  variant="destructive"
                  size="md"
                  loading={isSubmittingDelete}
                  onClick={handleSubmitDelete}
                >
                  Delete Vehicle
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
};
