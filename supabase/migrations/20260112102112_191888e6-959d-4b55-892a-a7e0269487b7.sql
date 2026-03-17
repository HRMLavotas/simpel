-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin_unit', 'admin_pusat');

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'admin_unit',
  UNIQUE (user_id, role)
);

-- Create departments table (master data unit kerja)
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip VARCHAR(18) UNIQUE,
  name VARCHAR(255) NOT NULL,
  old_position VARCHAR(255),
  position_type VARCHAR(255),
  position_name VARCHAR(255),
  asn_status VARCHAR(50),
  rank_group VARCHAR(50),
  department VARCHAR(255) NOT NULL,
  join_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user department
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS VARCHAR(255)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department
  FROM public.profiles
  WHERE id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admin pusat can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin pusat can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin pusat can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin_pusat'));

-- RLS Policies for departments (readable by all authenticated)
CREATE POLICY "Authenticated users can view departments"
ON public.departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin pusat can manage departments"
ON public.departments FOR ALL
USING (public.has_role(auth.uid(), 'admin_pusat'));

-- RLS Policies for employees
CREATE POLICY "Admin unit can view own department employees"
ON public.employees FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
);

CREATE POLICY "Admin pusat can view all employees"
ON public.employees FOR SELECT
USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin unit can insert own department employees"
ON public.employees FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
);

CREATE POLICY "Admin pusat can insert any employee"
ON public.employees FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin unit can update own department employees"
ON public.employees FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
);

CREATE POLICY "Admin pusat can update any employee"
ON public.employees FOR UPDATE
USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin unit can delete own department employees"
ON public.employees FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin_unit') 
  AND department = public.get_user_department(auth.uid())
);

CREATE POLICY "Admin pusat can delete any employee"
ON public.employees FOR DELETE
USING (public.has_role(auth.uid(), 'admin_pusat'));

-- RLS Policies for audit_logs
CREATE POLICY "Admin pusat can view all audit logs"
ON public.audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin_pusat'));

CREATE POLICY "Admin unit can view own department audit logs"
ON public.audit_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin_unit')
  AND user_id = auth.uid()
);

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Admin'),
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'Pusat')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'admin_unit')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert master data departments
INSERT INTO public.departments (name) VALUES
  ('Setditjen Binalavotas'),
  ('Direktorat Bina Stankomproglat'),
  ('Direktorat Bina Lemlatvok'),
  ('Direktorat Bina Lavogan'),
  ('Direktorat Bina Intala'),
  ('Direktorat Bina Peningkatan Produktivitas'),
  ('Set. BNSP'),
  ('BBPVP Bekasi'),
  ('BBPVP Bandung'),
  ('BBPVP Serang'),
  ('BBPVP Medan'),
  ('BBPVP Semarang'),
  ('BBPVP Makassar'),
  ('BPVP Surakarta'),
  ('BPVP Ambon'),
  ('BPVP Ternate'),
  ('BPVP Banda Aceh'),
  ('BPVP Sorong'),
  ('BPVP Kendari'),
  ('BPVP Samarinda'),
  ('BPVP Padang'),
  ('BPVP Bandung Barat'),
  ('BPVP Lotim'),
  ('BPVP Bantaeng'),
  ('BPVP Banyuwangi'),
  ('BPVP Sidoarjo'),
  ('BPVP Pangkep'),
  ('BPVP Belitung'),
  ('Pusat');

-- Create indexes for better performance
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_employees_asn_status ON public.employees(asn_status);
CREATE INDEX idx_employees_nip ON public.employees(nip);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_department ON public.profiles(department);