import { Box, Checkbox, FormControlLabel, TextField, Typography, useTheme, alpha } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

/**
 * Inline theme preview that renders sample UI elements with the currently
 * active theme settings so users can see the effect of font, colour, border
 * radius, and density changes without navigating away from the preferences.
 */
export function ThemePreviewCard() {
  const theme = useTheme();
  const { text, divider, primary } = theme.palette;

  return (
    <Card sx={{ mb: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderBottom: `1px solid ${divider}`,
        }}
      >
        <Typography
          sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0 }}
        >
          Live Preview
        </Typography>
        <Typography
          sx={{ color: text.secondary, fontSize: 13, mt: 0.25 }}
        >
          Sample UI rendered with your current selections — changes apply immediately.
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        {/* Typography sample */}
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Aa — The quick brown fox
        </Typography>
        <Typography variant="body2" sx={{ color: text.secondary, mb: 2 }}>
          Body text with the selected font family, weight, and size scale.
        </Typography>

        {/* Button row */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" size="small">
            Primary
          </Button>
          <Button variant="outlined" size="small">
            Outlined
          </Button>
          <Button variant="text" size="small">
            Text
          </Button>
        </Box>

        {/* Input + Checkbox */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Sample input"
            sx={{ minWidth: 180 }}
          />
          <FormControlLabel
            control={<Checkbox size="small" />}
            label="Option"
            sx={{ '& .MuiTypography-root': { fontSize: 13, color: text.primary } }}
          />
        </Box>

        {/* Colour swatch */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${divider}`,
            bgcolor: alpha(primary.main, 0.04),
          }}
        >
          <Typography variant="caption" sx={{ color: text.secondary }}>
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: primary.main,
                mr: 1,
                verticalAlign: 'middle',
              }}
            />
            Accent colour preview — cards, borders, and highlights
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}


