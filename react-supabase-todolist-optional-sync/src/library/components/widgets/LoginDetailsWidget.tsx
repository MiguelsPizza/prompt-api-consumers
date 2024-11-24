import React from 'react';
import { Formik, FormikErrors } from 'formik';

export type LoginDetailsFormValues = {
  email: string;
  password: string;
};

export type LoginAction = {
  title: string;
  onClick: (values: LoginDetailsFormValues) => any;
};

export type LoginDetailsWidgetProps = {
  title: string;
  secondaryActions: LoginAction[];
  onSubmit: (values: LoginDetailsFormValues) => any;
  submitTitle: string;
};

export const LoginDetailsWidget: React.FC<LoginDetailsWidgetProps> = (props) => {
  return (
    <div className="main-container">
      <div className="login-container">
        <h4 className="login-header">{props.title}</h4>
        <div className="logo-box">
          <img className="logo" alt="PowerSync Logo" width={400} height={100} src="/powersync-logo.svg" />
          <img className="logo" alt="Supabase Logo" width={300} height={80} src="/supabase-logo.png" />
        </div>
        <Formik<LoginDetailsFormValues>
          initialValues={{ email: '', password: '' }}
          validateOnChange={false}
          validateOnBlur={false}
          validate={(values) => {
            const errors: FormikErrors<LoginDetailsFormValues> = {};
            if (!values.email) {
              errors.email = 'Required';
            } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
              errors.email = 'Invalid email address';
            }

            if (!values.password) {
              errors.password = 'Required';
            }
            return errors;
          }}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            try {
              await props.onSubmit(values);
            } catch (ex: any) {
              console.error(ex);
              setSubmitting(false);
              setFieldError('password', ex.message);
            }
          }}
        >
          {({ values, errors, handleChange, handleBlur, isSubmitting, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div className="input-group">
                  <input
                    id="email-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email Address"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.email}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <div className="error-text">{errors.email}</div>}
                </div>
                <div className="input-group">
                  <input
                    id="password-input"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password}
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <div className="error-text">{errors.password}</div>}
                </div>
              </div>
              <div className="action-button-group">
                {props.secondaryActions.map((action) => {
                  return (
                    <button
                      key={action.title}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        action.onClick(values);
                      }}
                    >
                      {action.title}
                    </button>
                  );
                })}
                <button type="submit" disabled={isSubmitting}>
                  {props.submitTitle}
                </button>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
};
