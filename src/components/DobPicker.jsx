import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Scoped theme so MUI matches the app's palette without touching global styles
const theme = createTheme({
  palette: {
    primary: { main: '#941c34', dark: '#721226', contrastText: '#fff' },
    error: { main: '#941c34' },
    text: { primary: '#202b27', secondary: '#74807a' }
  },
  typography: { fontFamily: '"Poppins", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' },
  shape: { borderRadius: 12 }
});

const fieldSx = {
  '& .MuiPickersOutlinedInput-root': {
    height: 52,
    borderRadius: '7px',
    background: 'linear-gradient(180deg, #fff, #fbfaf8)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text)'
  },
  '& .MuiPickersOutlinedInput-notchedOutline': { borderColor: '#dbe2ea' },
  '& .MuiPickersOutlinedInput-root:hover .MuiPickersOutlinedInput-notchedOutline': { borderColor: '#cfc8bf' },
  // MUI's own focus/error selectors are highly specific, hence !important
  '& .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline': {
    borderColor: 'var(--gold) !important',
    borderWidth: '1px !important',
    boxShadow: '0 0 0 3px rgba(220, 168, 74, .2)'
  },
  '& .MuiPickersOutlinedInput-root.Mui-error .MuiPickersOutlinedInput-notchedOutline': { borderColor: '#e0899a !important' },
  '& .MuiPickersOutlinedInput-root.Mui-error': { background: '#fffafb' },
  '& .MuiPickersSectionList-root': { padding: '0 0 0 1px' },
  '& .MuiInputAdornment-root .MuiIconButton-root': { color: '#74807a' }
};

const MIN_DATE = dayjs('1940-01-01');
// Members are youth, so the year list opens around 20 years ago
const REFERENCE_DATE = dayjs().subtract(20, 'year').startOf('year');

// Value in and out is an ISO "YYYY-MM-DD" string ('' when empty)
function DobPicker({ id, value, onChange, error }) {
  const parsed = value ? dayjs(value) : null;

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <DatePicker
          value={parsed}
          onChange={(v) => onChange(v && v.isValid() ? v.format('YYYY-MM-DD') : '')}
          format="DD/MM/YYYY"
          views={['year', 'month', 'day']}
          openTo={parsed ? 'day' : 'year'}
          yearsOrder="desc"
          referenceDate={REFERENCE_DATE}
          minDate={MIN_DATE}
          disableFuture
          slotProps={{
            textField: { id, fullWidth: true, error: !!error, sx: fieldSx },
            actionBar: { actions: ['clear', 'accept'] },
            popper: { placement: 'bottom-start' }
          }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default DobPicker;
