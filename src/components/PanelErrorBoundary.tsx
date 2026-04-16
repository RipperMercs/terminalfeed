import { Component, type ReactNode } from 'react';

interface Props {
  panelId: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[PanelCrash:${this.props.panelId}]`, error.message);
    fetch('/api/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `[PanelCrash:${this.props.panelId}] ${error.message}`,
        stack: info.componentStack?.substring(0, 1000) ?? '',
        url: window.location.href,
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
