import { Component, type ReactNode } from 'react';

/** Last-resort screen if a bug crashes rendering: offers a reload instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold">Something went wrong.</p>
          <button
            type="button"
            className="mt-4 min-h-11 rounded-xl bg-accent px-4 font-semibold text-on-accent"
            onClick={() => {
              window.location.hash = '#/';
              window.location.reload();
            }}
          >
            Reload the app
          </button>
        </div>
      </div>
    );
  }
}
