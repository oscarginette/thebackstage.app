# Toast Component

A reusable toast notification component that follows the Backstage design system.

## Features

- **4 variants**: `success`, `error`, `warning`, `info`
- **Auto-dismiss**: Configurable duration (default 5s, set to `0` to disable)
- **Action button**: Optional clickable action (e.g., "Go to Settings")
- **Animated**: Smooth entrance/exit with Framer Motion
- **Positioned**: Fixed top-right corner, responsive
- **Accessible**: Close button with aria-label

## Usage

### Basic Usage

```tsx
import { useState } from 'react';
import Toast from '@/components/ui/Toast';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  return (
    <>
      <button onClick={() => setShowToast(true)}>
        Show Toast
      </button>

      <Toast
        message="Operation completed successfully!"
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}
```

### With Action Button

```tsx
<Toast
  message="You need to connect your account first."
  type="warning"
  isVisible={showToast}
  onClose={() => setShowToast(false)}
  action={{
    label: 'Go to Settings',
    onClick: () => router.push('/settings')
  }}
  duration={0} // Disable auto-dismiss when there's an action
/>
```

### Custom Duration

```tsx
<Toast
  message="File uploaded successfully"
  type="success"
  isVisible={showToast}
  onClose={() => setShowToast(false)}
  duration={3000} // Auto-dismiss after 3 seconds
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | Required | The toast message text |
| `type` | `'success' \| 'error' \| 'info' \| 'warning'` | `'info'` | Toast variant/style |
| `isVisible` | `boolean` | Required | Controls toast visibility |
| `onClose` | `() => void` | Required | Callback when toast is dismissed |
| `action` | `{ label: string, onClick: () => void }` | `undefined` | Optional action button |
| `duration` | `number` | `5000` | Auto-dismiss duration in ms (0 = manual only) |

## Design System

The Toast component follows Backstage's design patterns:

- **Colors**: Uses semantic colors from the design system
  - Success: Emerald (`emerald-50`, `emerald-600`)
  - Error: Red (`red-50`, `red-600`)
  - Warning: Amber (`amber-50`, `amber-600`)
  - Info: Blue (`blue-50`, `blue-600`)

- **Typography**: Small (`text-xs`), medium weight (`font-medium`)
- **Borders**: Rounded corners (`rounded-xl`), subtle borders
- **Animations**: Slide + fade entrance from top
- **Backdrop**: Subtle blur effect (`backdrop-blur-xl`)
- **Icons**: Lucide React icons (contextual to type)

## Examples

### Success Toast
```tsx
<Toast
  message="Contact imported successfully!"
  type="success"
  isVisible={showSuccess}
  onClose={() => setShowSuccess(false)}
/>
```

### Error Toast
```tsx
<Toast
  message="Failed to connect to API. Please try again."
  type="error"
  isVisible={showError}
  onClose={() => setShowError(false)}
  duration={7000}
/>
```

### Info Toast
```tsx
<Toast
  message="New features available! Check out what's new."
  type="info"
  isVisible={showInfo}
  onClose={() => setShowInfo(false)}
/>
```

### Warning Toast with Action
```tsx
<Toast
  message="Your session will expire in 5 minutes."
  type="warning"
  isVisible={showWarning}
  onClose={() => setShowWarning(false)}
  action={{
    label: 'Extend Session',
    onClick: handleExtendSession
  }}
  duration={0}
/>
```

## Best Practices

1. **Use appropriate types**: Match the toast type to the message context
2. **Keep messages concise**: Aim for 1-2 sentences max
3. **Add actions when needed**: If user can take action, provide a button
4. **Disable auto-dismiss for actions**: Set `duration={0}` when there's an action button
5. **One toast at a time**: Avoid showing multiple toasts simultaneously
6. **Use for transient info**: For persistent errors, use inline error messages instead

## Migration from `confirm()` and `alert()`

### Before (native confirm)
```tsx
if (confirm('Delete this item?')) {
  handleDelete();
}
```

### After (with Toast)
```tsx
const [showConfirmToast, setShowConfirmToast] = useState(false);

// Trigger
setShowConfirmToast(true);

// Component
<Toast
  message="Are you sure you want to delete this item?"
  type="warning"
  isVisible={showConfirmToast}
  onClose={() => setShowConfirmToast(false)}
  action={{
    label: 'Delete',
    onClick: handleDelete
  }}
  duration={0}
/>
```

**Note**: For true confirm dialogs with Yes/No, consider creating a separate Modal component instead.
