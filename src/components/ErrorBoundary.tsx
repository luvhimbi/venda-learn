import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-5 text-center">
                    <h2 className="fw-bold">Oritshatsha! (Something went wrong)</h2>
                    <p className="text-muted">The chat could not be displayed. Please try refreshing.</p>
                    <button
                        className="btn btn-dark rounded-pill px-4 mt-3"
                        onClick={() => window.location.reload()}
                    >
                        REFRESH PAGE
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
