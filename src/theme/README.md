# PlatiSystem Design System

A comprehensive Tailwind CSS-based design system for the PlatiSystem ERP application.

## 📁 Structure

```
theme/
├── tokens/           # Design tokens (colors, typography, spacing, etc.)
├── components/       # Component class utilities
├── utils/            # Layout patterns and helper utilities
├── index.js          # Main entry point
└── README.md         # This file
```

## 🎨 Design Tokens

### Colors

The design system provides a comprehensive color palette organized by purpose:

#### Brand Colors
- **Primary** (`brand-primary-*`): Professional blue for primary actions
- **Secondary** (`brand-secondary-*`): Purple for secondary elements

#### Semantic Colors
- **Success** (`semantic-success-*`): Green for positive states
- **Warning** (`semantic-warning-*`): Amber for cautionary states
- **Error** (`semantic-error-*`): Red for error states
- **Info** (`semantic-info-*`): Cyan for informational content

#### Domain Colors (Business-specific)
- **Production** (`domain-production-*`): Amber for manufacturing
- **Inventory** (`domain-inventory-*`): Blue for stock management
- **Sales** (`domain-sales-*`): Green for sales operations
- **Finance** (`domain-finance-*`): Cyan for financial data
- **Quality** (`domain-quality-*`): Purple for quality assurance
- **Dealers** (`domain-dealers-*`): Pink for dealer management

#### Status Colors
Pre-configured status badge colors:
```jsx
<div className="bg-status-pending-bg text-status-pending-text border border-status-pending-border">
  Pending
</div>
```

### Typography

Font system with Inter as the primary typeface:

```jsx
// Heading styles
<h1 className="text-4xl font-bold text-text-primary">Heading</h1>

// Body text
<p className="text-base text-text-primary">Body text</p>

// Labels
<label className="text-sm font-medium text-text-primary">Label</label>
```

**Pre-defined text styles** available in `textStyles`:
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6` - Heading styles
- `body`, `bodyLarge`, `bodySmall` - Body text
- `label`, `labelSmall`, `labelLarge` - Labels
- `caption`, `captionBold` - Captions
- `link`, `linkSubtle` - Links
- `code`, `codeBlock` - Code styles

### Spacing

Consistent spacing scale from 0.125rem (2px) to 24rem (384px):

```jsx
<div className="p-4 m-6 gap-2">
  Content with padding, margin, and gap
</div>
```

**Spacing patterns** in `spacingPatterns`:
```jsx
import { spacingPatterns } from '@/theme';

<div className={spacingPatterns.componentPaddingMd}>Padded content</div>
<div className={spacingPatterns.stackMd}>Vertically stacked items</div>
```

### Shadows

Elevation system from subtle to dramatic:

```jsx
<div className="shadow-md hover:shadow-lg">Card with shadow</div>
<div className="shadow-primary">Primary colored shadow</div>
```

**Shadow patterns** in `shadowPatterns`:
```jsx
import { shadowPatterns } from '@/theme';

<button className={shadowPatterns.button}>Button</button>
<div className={shadowPatterns.card}>Card</div>
```

### Animations

Smooth transitions and keyframe animations:

```jsx
<div className="transition-all duration-200 hover:scale-105">
  Animated element
</div>
```

**Animation presets** in `animations.animation`:
- `fadeIn`, `fadeOut` - Fade animations
- `slideInRight`, `slideInLeft`, `slideInUp`, `slideInDown` - Slide animations
- `scaleIn`, `scaleOut` - Scale animations
- `pulse`, `spin`, `bounce` - Continuous animations

## 🧩 Component Classes

### Button

Pre-built button styles with variants and sizes:

```jsx
import { getButtonClasses } from '@/theme';

<button className={getButtonClasses('primary', 'md')}>
  Primary Button
</button>

// Available variants: primary, secondary, outline, ghost, danger, success, warning, text, link
// Available sizes: xs, sm, md, lg, xl
```

### Card

Card component styles:

```jsx
import { getCardClasses } from '@/theme';

<div className={getCardClasses('elevated', 'md')}>
  Card content
</div>

// Variants: default, elevated, outlined, flat, interactive, success, warning, error, info
// Padding: none, xs, sm, md, lg, xl
```

### Input

Form input styles:

```jsx
import { getInputClasses } from '@/theme';

<input className={getInputClasses('default', 'md')} />

// Variants: default, error, success, warning, filled
// Sizes: sm, md, lg
```

### Badge

Status badges and tags:

```jsx
import { getBadgeClasses } from '@/theme';

<span className={getBadgeClasses('pending', 'md')}>Pending</span>

// Status variants: pending, inProgress, completed, cancelled, paused, urgent
// Semantic variants: success, warning, error, info
// Domain variants: production, inventory, sales, finance, quality, dealers
// Sizes: xs, sm, md, lg
```

## 🛠️ Utilities

### Layout Patterns

Common layout configurations:

```jsx
import { layoutPatterns } from '@/theme';

<div className={layoutPatterns.container}>Container</div>
<div className={layoutPatterns.flexCenter}>Centered content</div>
<div className={layoutPatterns.grid3}>3-column grid</div>
```

**Available patterns:**
- Containers: `container`, `containerFluid`, `containerNarrow`, `containerWide`
- Flexbox: `flexCenter`, `flexBetween`, `flexStart`, `flexEnd`, `flexCol`
- Grids: `grid2`, `grid3`, `grid4`, `gridAuto`
- Pages: `pageWrapper`, `pageHeader`, `pageContent`, `pageFooter`
- Dashboards: `dashboardGrid`, `dashboardCard`, `dashboardStats`

### Helper Functions

Utility functions for class management:

```jsx
import { cn, getStatusColor, getDomainColor } from '@/theme';

// Combine classes conditionally
const classes = cn(
  'base-class',
  isActive && 'active-class',
  'another-class'
);

// Get status color classes
<div className={getStatusColor('pending')}>Pending Status</div>

// Get domain color classes
<div className={getDomainColor('production')}>Production</div>
```

## 📖 Usage Examples

### Simple Button

```jsx
import { getButtonClasses } from '@/theme';

export function MyButton({ children, onClick }) {
  return (
    <button
      className={getButtonClasses('primary', 'md')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Status Badge

```jsx
import { getBadgeClasses } from '@/theme';

export function StatusBadge({ status }) {
  return (
    <span className={getBadgeClasses(status, 'sm')}>
      {status}
    </span>
  );
}
```

### Dashboard Card

```jsx
import { getCardClasses } from '@/theme';
import { layoutPatterns } from '@/theme';

export function DashboardCard({ title, children }) {
  return (
    <div className={getCardClasses('elevated', 'lg')}>
      <div className="border-b border-border-light pb-4 mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <div className={layoutPatterns.stackMd}>
        {children}
      </div>
    </div>
  );
}
```

### Form Input with Label

```jsx
import { getInputClasses, inputLabel, inputHelperText } from '@/theme';

export function FormField({ label, error, helperText, ...props }) {
  return (
    <div>
      <label className={inputLabel.default}>
        {label}
      </label>
      <input
        className={getInputClasses(error ? 'error' : 'default', 'md')}
        {...props}
      />
      {error && (
        <p className={inputHelperText.error}>{error}</p>
      )}
      {!error && helperText && (
        <p className={inputHelperText.default}>{helperText}</p>
      )}
    </div>
  );
}
```

## 🎯 Best Practices

1. **Use tokens consistently**: Always reference design tokens instead of hardcoded values
2. **Leverage component utilities**: Use pre-built component classes for consistency
3. **Maintain hierarchy**: Use semantic color names that match business context
4. **Responsive design**: Utilize responsive patterns from the utilities
5. **Accessibility**: All components include focus states and proper contrast
6. **Performance**: Classes are generated at build time by Tailwind

## 🔄 Extending the System

### Adding New Colors

```javascript
// theme/tokens/colors.js
export const colors = {
  // ... existing colors
  custom: {
    50: '#...',
    500: '#...',
    // ... other shades
  }
};
```

### Adding New Component Styles

```javascript
// theme/components/MyComponent.js
export const myComponentBase = 'base-classes-here';

export const myComponentVariants = {
  default: `${myComponentBase} variant-specific-classes`,
  // ... other variants
};

export const getMyComponentClasses = (variant = 'default') => {
  return myComponentVariants[variant] || myComponentVariants.default;
};
```

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design System Best Practices](https://www.designsystems.com/)
- Inter Font: Primary typeface for the system

## 🤝 Contributing

When adding to the design system:
1. Follow the existing naming conventions
2. Add new tokens to the appropriate files
3. Update this documentation
4. Ensure backward compatibility with existing components
5. Test across different screen sizes and themes
