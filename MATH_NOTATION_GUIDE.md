# Math Notation Guide

This system now supports proper mathematical symbols, especially for exponents and radical signs using KaTeX rendering.

## Usage

### LaTeX Math Mode (Recommended for Complex Expressions)

Use `$...$` for inline math or `$$...$$` for display math (centered, larger):

**Inline Math Examples:**
- `$x^2 + y^2 = r^2$` → Pythagorean theorem
- `$\frac{a}{b}$` → Fractions
- `$\sqrt{x^2 + y^2}$` → Square root with expression
- `$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$` → Summation

**Display Math Examples:**
- `$$E = mc^2$$` → Famous equation (centered)
- `$$\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$` → Integral

### Simple Notation (Auto-converted)

The system automatically converts common notations to proper symbols:

#### Exponents
- `x^2` → x²
- `x^3` → x³
- `x^10` → x¹⁰
- `2^8` → 2⁸

#### Radicals
- `sqrt(x)` → √x
- `sqrt(x^2 + y^2)` → √(x² + y²)
- `cbrt(8)` → ∛8 (cube root)
- `root(4, 16)` → ⁴√16 (4th root of 16)

#### Greek Letters
- `alpha`, `beta`, `gamma`, `delta` → α, β, γ, δ
- `theta`, `lambda`, `mu`, `pi` → θ, λ, μ, π
- `sigma`, `phi`, `omega` → σ, φ, ω
- Capital letters: `Delta`, `Sigma`, `Omega` → Δ, Σ, Ω

#### Mathematical Operators
- `>=` → ≥
- `<=` → ≤
- `!=` → ≠
- `*` → ×
- `+-` → ±
- `degrees` → °

## Examples for Questions

### Algebra
```
What is the solution to $x^2 - 5x + 6 = 0$?
```

### Geometry
```
Calculate the hypotenuse: $c = sqrt(a^2 + b^2)$
```

### Trigonometry
```
Find theta if $sin(theta) = 0.5$
```

### Calculus
```
$$\frac{d}{dx}(x^3) = 3x^2$$
```

### Physics
```
The kinetic energy is given by $$KE = \frac{1}{2}mv^2$$
```

### Chemistry
```
The concentration is sqrt(K_a * C) where K_a is the dissociation constant
```

## Tips

1. **For simple expressions**: Use plain notation like `x^2`, `sqrt(x)`, which will be auto-converted
2. **For complex expressions**: Use LaTeX with `$...$` or `$$...$$` for proper formatting
3. **Fractions**: Use `\frac{numerator}{denominator}` inside `$...$`
4. **Subscripts**: Use `_` in LaTeX mode: `$H_2O$` → H₂O
5. **Greek letters**: Just type the name: `alpha`, `beta`, `pi` will be converted automatically

## Full LaTeX Support

Since we're using KaTeX, you have access to all standard LaTeX math commands:

- `\frac{}{}` - fractions
- `\sqrt{}`, `\sqrt[]{}` - roots
- `\sum`, `\prod`, `\int` - summation, product, integral
- `\alpha`, `\beta`, `\theta` - Greek letters
- `\sin`, `\cos`, `\tan`, `\log`, `\ln` - functions
- `\left(`, `\right)` - auto-sizing parentheses
- `\begin{matrix}...\end{matrix}` - matrices
- And many more!

For full LaTeX documentation, visit: https://katex.org/docs/supported.html
