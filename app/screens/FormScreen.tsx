import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Divider,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Web-only pure HTML form ───────────────────────────────────────────────────

function WebForm() {
  // Read URL params for pre-fill
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tournamentName = params.get('tournamentName');
    const tournamentId   = params.get('tournamentId');

    if (tournamentName) {
      const el = document.getElementById('eventName-input') as HTMLInputElement;
      if (el) el.value = decodeURIComponent(tournamentName);
    }

    // Pre-fill from saved profile
    AsyncStorage.getItem('kumite_profile').then(raw => {
      if (!raw) return;
      try {
        const profile = JSON.parse(raw);
        const set = (id: string, val: string) => {
          const el = document.getElementById(id) as HTMLInputElement;
          if (el && val) el.value = val;
        };
        if (profile.role === 'athlete') {
          set('fullName-input',  profile.fullName);
          set('email-input',     profile.email);
          set('country-input',   profile.country);
          set('age-input',       profile.age);
          set('academy-input',   profile.academy);
          set('weight-input',    profile.weight);
          if (profile.gender) {
            const g = document.getElementById('gender-input') as HTMLSelectElement;
            if (g) g.value = profile.gender;
          }
          if (profile.beltGrade) {
            const b = document.getElementById('athleteGrade-input') as HTMLSelectElement;
            if (b) b.value = profile.beltGrade;
          }
        } else if (profile.role === 'coach') {
          set('coachName-input', profile.fullName);
        }
      } catch {}
    });
  }, []);

  const handleSubmit = () => {
    const get = (id: string) => ((document.getElementById(id) as HTMLInputElement)?.value || '').trim();
    const setErr = (id: string, msg: string) => {
      const el = document.getElementById(`${id}-error`);
      if (el) { el.textContent = msg; el.style.visibility = msg ? 'visible' : 'hidden'; }
      const inp = document.getElementById(id) as HTMLInputElement;
      if (inp) inp.style.borderColor = msg ? '#b3261e' : '#ccc';
    };
    const clearErr = (id: string) => setErr(id, '');

    const ids = ['fullName-input','email-input','country-input','age-input','gender-input',
                 'academy-input','weight-input','athleteGrade-input','categoryType-input',
                 'eventName-input','coachName-input'];
    ids.forEach(clearErr);

    const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const isNum   = (v: string) => !isNaN(parseFloat(v)) && parseFloat(v) > 0;

    const v = {
      fullName:     get('fullName-input'),
      email:        get('email-input'),
      country:      get('country-input'),
      age:          get('age-input'),
      gender:       get('gender-input'),
      academy:      get('academy-input'),
      weight:       get('weight-input'),
      athleteGrade: get('athleteGrade-input'),
      categoryType: get('categoryType-input'),
      eventName:    get('eventName-input'),
      coachName:    get('coachName-input'),
    };

    let hasError = false;
    const err = (id: string, msg: string) => { setErr(id, msg); hasError = true; };

    if (!v.fullName)            err('fullName-input',     'Full name is required');
    if (!v.email)               err('email-input',        'Email is required');
    else if (!isEmail(v.email)) err('email-input',        'Enter a valid email');
    if (!v.gender)              err('gender-input',       'Gender is required');
    if (!v.country)             err('country-input',      'Country is required');
    if (!v.age)                 err('age-input',          'Age is required');
    else if (!isNum(v.age))     err('age-input',          'Enter a valid age');
    if (!v.weight)              err('weight-input',       'Weight is required');
    else if (!isNum(v.weight))  err('weight-input',       'Enter a valid weight (kg)');
    if (!v.academy)             err('academy-input',      'Academy is required');
    if (!v.athleteGrade)        err('athleteGrade-input', 'Grade is required');
    if (!v.coachName)           err('coachName-input',    'Coach name is required');
    if (!v.eventName)           err('eventName-input',    'Event name is required');
    if (!v.categoryType)        err('categoryType-input', 'Category type is required');

    if (!hasError) {
      // Save registration to AsyncStorage
      const params = new URLSearchParams(window.location.search);
      const tournamentId   = params.get('tournamentId')   || 'unknown';
      const tournamentName = params.get('tournamentName') ? decodeURIComponent(params.get('tournamentName')!) : v.eventName;

      AsyncStorage.getItem('kumite_registrations').then(raw => {
        const existing = raw ? JSON.parse(raw) : [];
        existing.push({ tournamentId, tournamentName, athleteName: v.fullName, timestamp: new Date().toISOString() });
        AsyncStorage.setItem('kumite_registrations', JSON.stringify(existing));
      });

      console.log('Submitted:', v);
      const banner = document.getElementById('success-message');
      if (banner) { banner.style.display = 'block'; }
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) form.reset();
    }
  };

  const handleReset = () => {
    const ids = ['fullName-input','email-input','country-input','age-input','gender-input',
                 'academy-input','weight-input','athleteGrade-input','categoryType-input',
                 'eventName-input','coachName-input'];
    ids.forEach(id => {
      const errEl = document.getElementById(`${id}-error`);
      if (errEl) { errEl.textContent = ''; errEl.style.visibility = 'hidden'; }
      const inp = document.getElementById(id) as HTMLInputElement;
      if (inp) inp.style.borderColor = '#ccc';
    });
    const banner = document.getElementById('success-message');
    if (banner) banner.style.display = 'none';
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) form.reset();
  };

  const s: any = {
    page:      { minHeight: '100vh', background: '#f5f5f5', padding: 16, fontFamily: 'Roboto, sans-serif' },
    card:      { maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
    title:     { fontSize: 24, fontWeight: 700, marginBottom: 4 },
    sub:       { color: '#666', marginBottom: 20, fontSize: 14 },
    section:   { color: '#6750a4', fontWeight: 700, fontSize: 12, letterSpacing: 1.2, marginTop: 20, marginBottom: 4 },
    divider:   { border: 'none', borderTop: '1px solid #e0e0e0', marginBottom: 16 },
    field:     { marginBottom: 12 },
    label:     { display: 'block', fontSize: 12, color: '#555', marginBottom: 4 },
    input:     { width: '100%', height: 48, border: '1px solid #ccc', borderRadius: 4, padding: '0 12px', fontSize: 16, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
    select:    { width: '100%', height: 48, border: '1px solid #ccc', borderRadius: 4, paddingLeft: 12, fontSize: 16, boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' },
    errTxt:    { color: '#b3261e', fontSize: 12, marginTop: 2, visibility: 'hidden', minHeight: 18 },
    success:   { background: '#eaddff', borderRadius: 8, padding: 12, marginBottom: 16, textAlign: 'center', color: '#21005d', display: 'none' },
    actions:   { display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' },
    resetBtn:  { flex: 1, padding: '10px 16px', border: '1px solid #6750a4', borderRadius: 20, background: 'transparent', color: '#6750a4', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    submitBtn: { flex: 2, padding: '10px 24px', background: '#6750a4', border: 'none', borderRadius: 20, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  };

  const Field = ({ id, label, type = 'text', placeholder }: { id: string; label: string; type?: string; placeholder: string }) => (
    <div style={s.field}>
      <label style={s.label} htmlFor={id}>{label}</label>
      <input id={id} name={id} data-testid={id} type={type} placeholder={placeholder} style={s.input} />
      <div id={`${id}-error`} data-testid={`${id}-error`} style={s.errTxt}></div>
    </div>
  );

  const Select = ({ id, label, options }: { id: string; label: string; options: string[] }) => (
    <div style={s.field}>
      <label style={s.label} htmlFor={id}>{label}</label>
      <select id={id} name={id} data-testid={id} style={s.select}>
        <option value="">-- Select {label} --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div id={`${id}-error`} data-testid={`${id}-error`} style={s.errTxt}></div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>🏆 Inscripción al Torneo</div>
        <div style={s.sub}>Formulario de Inscripción de Atleta</div>

        <div id="success-message" data-testid="success-message" style={s.success}>
          ✓ Athlete registered successfully!
        </div>

        <form noValidate>
          <div style={s.section}>INFORMACIÓN DEL ATLETA</div>
          <hr style={s.divider} />
          <Field id="fullName-input"  label="Nombre Completo"  placeholder="Nombre Completo" />
          <Field id="email-input"     label="Correo Electrónico" placeholder="Correo Electrónico" type="email" />
          <Field id="country-input"   label="País"             placeholder="País" />
          <Field id="age-input"       label="Edad"             placeholder="Edad" type="number" />
          <Select id="gender-input"   label="Género"           options={['Masculino','Femenino','Otro']} />

          <div style={s.section}>DETALLES DE INSCRIPCIÓN</div>
          <hr style={s.divider} />
          <Field id="academy-input"       label="Academia"               placeholder="Academia" />
          <Field id="weight-input"        label="Peso (kg)"              placeholder="Peso (kg)" type="number" />
          <Select id="athleteGrade-input" label="Grado / Cinturón"       options={['Blanco','Azul','Morado','Café','Negro']} />
          <Select id="categoryType-input" label="Tipo de Categoría"      options={['Gi','No-Gi','Wrestling','Judo','Sambo']} />

          <div style={s.section}>EVENTO Y ENTRENADOR</div>
          <hr style={s.divider} />
          <Field id="eventName-input" label="Nombre del Evento"      placeholder="Nombre del Evento" />
          <Field id="coachName-input" label="Nombre del Entrenador"  placeholder="Nombre del Entrenador" />

          <div style={s.actions}>
            <button type="button" onClick={handleReset}  style={s.resetBtn}>↺ Limpiar</button>
            <button type="button" onClick={handleSubmit} style={s.submitBtn}>➤ Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Native Material form ──────────────────────────────────────────────────────

function NativeForm() {
  const theme = useTheme();
  const [form, setForm]     = useState({ fullName:'', email:'', gender:'', country:'', age:'', weight:'', academy:'', athleteGrade:'', coachName:'', eventName:'', categoryType:'' });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [snack, setSnack]   = useState(false);

  const set = (k: string) => (v: string) => setForm(p => ({...p,[k]:v}));

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.fullName.trim())  e.fullName = 'Nombre requerido';
    if (!form.email.trim())     e.email    = 'Correo requerido';
    if (!form.country.trim())   e.country  = 'País requerido';
    if (!form.age.trim())       e.age      = 'Edad requerida';
    if (!form.gender)           e.gender   = 'Género requerido';
    if (!form.academy.trim())   e.academy  = 'Academia requerida';
    if (!form.weight.trim())    e.weight   = 'Peso requerido';
    if (!form.athleteGrade)     e.athleteGrade = 'Grado requerido';
    if (!form.categoryType)     e.categoryType = 'Categoría requerida';
    if (!form.eventName.trim()) e.eventName = 'Evento requerido';
    if (!form.coachName.trim()) e.coachName = 'Entrenador requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const { TextInput, HelperText } = require('react-native-paper');

  const Field = ({ label, field, type='default' }: { label:string; field:string; type?:string }) => (
    <View style={{marginBottom:4}}>
      <TextInput label={label} value={(form as any)[field]} onChangeText={set(field)}
        mode="outlined" error={!!(errors as any)[field]}
        keyboardType={type==='email'?'email-address':type==='number'?'numeric':'default'}
        autoCapitalize={type==='email'?'none':'words'} testID={`${field}-input`} />
      <HelperText type="error" visible={!!(errors as any)[field]} testID={`${field}-input-error`}>
        {(errors as any)[field]}
      </HelperText>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:theme.colors.background}} behavior="height">
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:32}} keyboardShouldPersistTaps="handled">
        <Card style={{borderRadius:12}} elevation={3}>
          <Card.Content>
            <Text variant="headlineMedium" style={{fontWeight:'700',marginBottom:4}}>🏆 Inscripción al Torneo</Text>
            <Text variant="bodyMedium" style={{color:theme.colors.onSurfaceVariant,marginBottom:20}}>Formulario de Inscripción</Text>
            <Text variant="titleSmall" style={{color:theme.colors.primary,fontWeight:'700',marginBottom:4}}>ATLETA</Text>
            <Divider style={{marginBottom:12}} />
            <Field label="Nombre Completo"  field="fullName" />
            <Field label="Correo"           field="email"   type="email" />
            <Field label="País"             field="country" />
            <Field label="Edad"             field="age"     type="number" />
            <Field label="Género"           field="gender" />
            <Text variant="titleSmall" style={{color:theme.colors.primary,fontWeight:'700',marginTop:16,marginBottom:4}}>INSCRIPCIÓN</Text>
            <Divider style={{marginBottom:12}} />
            <Field label="Academia"        field="academy" />
            <Field label="Peso (kg)"       field="weight"  type="number" />
            <Field label="Grado"           field="athleteGrade" />
            <Field label="Categoría"       field="categoryType" />
            <Text variant="titleSmall" style={{color:theme.colors.primary,fontWeight:'700',marginTop:16,marginBottom:4}}>EVENTO</Text>
            <Divider style={{marginBottom:12}} />
            <Field label="Nombre del Evento"     field="eventName" />
            <Field label="Nombre del Entrenador" field="coachName" />
            <View style={{flexDirection:'row',gap:12,marginTop:16}}>
              <Button mode="outlined"  onPress={()=>{setForm({fullName:'',email:'',gender:'',country:'',age:'',weight:'',academy:'',athleteGrade:'',coachName:'',eventName:'',categoryType:''});setErrors({});}} style={{flex:1}} icon="refresh">Limpiar</Button>
              <Button mode="contained" onPress={()=>{if(validate()){setSnack(true);}}} style={{flex:2}} icon="send">Registrar</Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      <Snackbar visible={snack} onDismiss={()=>setSnack(false)} duration={4000}>¡Atleta inscrito exitosamente!</Snackbar>
    </KeyboardAvoidingView>
  );
}

export default function FormScreen() {
  if (Platform.OS === 'web') return <WebForm />;
  return <NativeForm />;
}

const styles = StyleSheet.create({});
