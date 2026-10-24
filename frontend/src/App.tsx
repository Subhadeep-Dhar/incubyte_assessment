import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base text-charcoal-primary">
      {/* Header */}
      <header className="border-b border-surface-border bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-forest-700 inline-block" />
            <h1 className="text-lg font-semibold tracking-tight text-charcoal-primary">
              Incubyte Dealership
            </h1>
          </div>
          <nav aria-label="Main Navigation">
            <span className="text-xs uppercase tracking-wider text-charcoal-secondary font-medium">
              Phase 01 Scaffolding
            </span>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section aria-labelledby="catalog-heading" className="space-y-4">
          <div className="border-b border-surface-border pb-4">
            <h2
              id="catalog-heading"
              className="text-2xl font-semibold tracking-tight text-charcoal-primary"
            >
              Vehicle Inventory
            </h2>
            <p className="text-sm text-charcoal-secondary mt-1">
              Curated automotive collection and real-time inventory management.
            </p>
          </div>
          <div
            data-testid="catalog-placeholder"
            className="rounded-lg border border-dashed border-surface-border p-8 text-center bg-surface-muted"
          >
            <p className="text-sm text-charcoal-secondary">
              Foundation initialized. Full catalog, filter controls, and purchase flows scheduled
              for Phase 04.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface-muted py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-charcoal-secondary">
          Incubyte Car Dealership Inventory System &copy; {new Date().getFullYear()} — Built with
          TDD & Craftsmanship
        </div>
      </footer>
    </div>
  );
};

export default App;
