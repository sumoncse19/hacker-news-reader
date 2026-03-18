import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <div className="text-center">
            <div className="text-4xl mb-3">😵</div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-zinc-500 mb-4">
              An unexpected error occurred.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/";
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              Go to home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
