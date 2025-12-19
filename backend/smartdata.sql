--
-- PostgreSQL database dump
--

\restrict RL4PA0R9WwkBLVlRaCAAuwAHKNcqesyJ4LBC3KMZBrMoL1tafsgow8Hp92UOUo5

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-12-19 14:40:48

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 990 (class 1247 OID 35312)
-- Name: audit_agenda_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_agenda_status AS ENUM (
    'planned',
    'on_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.audit_agenda_status OWNER TO postgres;

--
-- TOC entry 1002 (class 1247 OID 35382)
-- Name: audit_result_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_result_status AS ENUM (
    'pass',
    'fail',
    'n/a'
);


ALTER TYPE public.audit_result_status OWNER TO postgres;

--
-- TOC entry 972 (class 1247 OID 35116)
-- Name: audit_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_status AS ENUM (
    'not_audited',
    'in_audit',
    'closed'
);


ALTER TYPE public.audit_status OWNER TO postgres;

--
-- TOC entry 954 (class 1247 OID 34771)
-- Name: inspection_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inspection_status AS ENUM (
    'in_progress',
    'completed',
    'pending_review'
);


ALTER TYPE public.inspection_status OWNER TO postgres;

--
-- TOC entry 978 (class 1247 OID 35192)
-- Name: review_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.review_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.review_status OWNER TO postgres;

--
-- TOC entry 966 (class 1247 OID 34832)
-- Name: task_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_priority AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE public.task_priority OWNER TO postgres;

--
-- TOC entry 963 (class 1247 OID 34822)
-- Name: task_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.task_status OWNER TO postgres;

--
-- TOC entry 903 (class 1247 OID 34435)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'manager',
    'staff',
    'engineering',
    'direksi'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 271 (class 1255 OID 34459)
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_set_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 34556)
-- Name: actual_dsr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actual_dsr (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    date date NOT NULL,
    room_available integer DEFAULT 0,
    room_ooo integer DEFAULT 0,
    room_com_and_hu integer DEFAULT 0,
    room_sold integer DEFAULT 0,
    number_of_guest integer DEFAULT 0,
    occp_r_sold_percent numeric(5,2) DEFAULT 0.00,
    arr numeric(15,2) DEFAULT 0.00,
    revpar numeric(15,2) DEFAULT 0.00,
    lodging_revenue numeric(15,2) DEFAULT 0.00,
    others_room_revenue numeric(15,2) DEFAULT 0.00,
    room_revenue numeric(15,2) DEFAULT 0.00,
    breakfast_revenue numeric(15,2) DEFAULT 0.00,
    restaurant_revenue numeric(15,2) DEFAULT 0.00,
    room_service numeric(15,2) DEFAULT 0.00,
    banquet_revenue numeric(15,2) DEFAULT 0.00,
    fnb_others_revenue numeric(15,2) DEFAULT 0.00,
    fnb_revenue numeric(15,2) DEFAULT 0.00,
    others_revenue numeric(15,2) DEFAULT 0.00,
    total_revenue numeric(15,2) DEFAULT 0.00,
    service numeric(15,2) DEFAULT 0.00,
    tax numeric(15,2) DEFAULT 0.00,
    gross_revenue numeric(15,2) DEFAULT 0.00,
    shared_payable numeric(15,2) DEFAULT 0.00,
    deposit_reservation numeric(15,2) DEFAULT 0.00,
    cash_fo numeric(15,2) DEFAULT 0.00,
    cash_outlet numeric(15,2) DEFAULT 0.00,
    bank_transfer numeric(15,2) DEFAULT 0.00,
    qris numeric(15,2) DEFAULT 0.00,
    credit_debit_card numeric(15,2) DEFAULT 0.00,
    city_ledger numeric(15,2) DEFAULT 0.00,
    total_settlement numeric(15,2) DEFAULT 0.00,
    gab numeric(15,2) DEFAULT 0.00,
    balance numeric(15,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.actual_dsr OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 34555)
-- Name: actual_dsr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actual_dsr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actual_dsr_id_seq OWNER TO postgres;

--
-- TOC entry 5400 (class 0 OID 0)
-- Dependencies: 228
-- Name: actual_dsr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actual_dsr_id_seq OWNED BY public.actual_dsr.id;


--
-- TOC entry 231 (class 1259 OID 34605)
-- Name: actuals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actuals (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    year integer NOT NULL,
    account_code character varying(100) NOT NULL,
    "values" jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.actuals OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 34604)
-- Name: actuals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actuals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actuals_id_seq OWNER TO postgres;

--
-- TOC entry 5401 (class 0 OID 0)
-- Dependencies: 230
-- Name: actuals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actuals_id_seq OWNED BY public.actuals.id;


--
-- TOC entry 242 (class 1259 OID 34702)
-- Name: ar_aging; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ar_aging (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    company_name character varying(255),
    invoice_number character varying(100),
    invoice_date date,
    total_bill numeric(15,2) DEFAULT 0,
    current numeric(15,2) DEFAULT 0,
    days_1_30 numeric(15,2) DEFAULT 0,
    days_31_60 numeric(15,2) DEFAULT 0,
    days_61_90 numeric(15,2) DEFAULT 0,
    days_over_90 numeric(15,2) DEFAULT 0,
    remarks text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ar_aging OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 34701)
-- Name: ar_aging_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ar_aging_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ar_aging_id_seq OWNER TO postgres;

--
-- TOC entry 5402 (class 0 OID 0)
-- Dependencies: 241
-- Name: ar_aging_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ar_aging_id_seq OWNED BY public.ar_aging.id;


--
-- TOC entry 264 (class 1259 OID 35322)
-- Name: audit_agendas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_agendas (
    id integer NOT NULL,
    date date NOT NULL,
    hotel_id integer NOT NULL,
    auditor character varying(255) NOT NULL,
    status public.audit_agenda_status DEFAULT 'planned'::public.audit_agenda_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_agendas OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 35321)
-- Name: audit_agendas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_agendas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_agendas_id_seq OWNER TO postgres;

--
-- TOC entry 5403 (class 0 OID 0)
-- Dependencies: 263
-- Name: audit_agendas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_agendas_id_seq OWNED BY public.audit_agendas.id;


--
-- TOC entry 266 (class 1259 OID 35350)
-- Name: audit_checklist_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_checklist_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_checklist_categories OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 35349)
-- Name: audit_checklist_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_checklist_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_checklist_categories_id_seq OWNER TO postgres;

--
-- TOC entry 5404 (class 0 OID 0)
-- Dependencies: 265
-- Name: audit_checklist_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_checklist_categories_id_seq OWNED BY public.audit_checklist_categories.id;


--
-- TOC entry 268 (class 1259 OID 35363)
-- Name: audit_checklist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_checklist_items (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name text NOT NULL,
    standard text,
    "position" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_checklist_items OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 35362)
-- Name: audit_checklist_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_checklist_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_checklist_items_id_seq OWNER TO postgres;

--
-- TOC entry 5405 (class 0 OID 0)
-- Dependencies: 267
-- Name: audit_checklist_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_checklist_items_id_seq OWNED BY public.audit_checklist_items.id;


--
-- TOC entry 270 (class 1259 OID 35390)
-- Name: audit_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_results (
    id integer NOT NULL,
    agenda_id integer NOT NULL,
    item_id integer NOT NULL,
    result public.audit_result_status NOT NULL,
    notes text,
    image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_results OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 35389)
-- Name: audit_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_results_id_seq OWNER TO postgres;

--
-- TOC entry 5406 (class 0 OID 0)
-- Dependencies: 269
-- Name: audit_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_results_id_seq OWNED BY public.audit_results.id;


--
-- TOC entry 218 (class 1259 OID 34425)
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    file_paths jsonb NOT NULL,
    thumbnail_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    hotel_id integer
);


ALTER TABLE public.books OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 34424)
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.books_id_seq OWNER TO postgres;

--
-- TOC entry 5407 (class 0 OID 0)
-- Dependencies: 217
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- TOC entry 227 (class 1259 OID 34507)
-- Name: budget_dsr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_dsr (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    date date NOT NULL,
    room_available integer DEFAULT 0,
    room_ooo integer DEFAULT 0,
    room_com_and_hu integer DEFAULT 0,
    room_sold integer DEFAULT 0,
    number_of_guest integer DEFAULT 0,
    occp_r_sold_percent numeric(5,2) DEFAULT 0.00,
    arr numeric(15,2) DEFAULT 0.00,
    revpar numeric(15,2) DEFAULT 0.00,
    lodging_revenue numeric(15,2) DEFAULT 0.00,
    others_room_revenue numeric(15,2) DEFAULT 0.00,
    room_revenue numeric(15,2) DEFAULT 0.00,
    breakfast_revenue numeric(15,2) DEFAULT 0.00,
    restaurant_revenue numeric(15,2) DEFAULT 0.00,
    room_service numeric(15,2) DEFAULT 0.00,
    banquet_revenue numeric(15,2) DEFAULT 0.00,
    fnb_others_revenue numeric(15,2) DEFAULT 0.00,
    fnb_revenue numeric(15,2) DEFAULT 0.00,
    others_revenue numeric(15,2) DEFAULT 0.00,
    total_revenue numeric(15,2) DEFAULT 0.00,
    service numeric(15,2) DEFAULT 0.00,
    tax numeric(15,2) DEFAULT 0.00,
    gross_revenue numeric(15,2) DEFAULT 0.00,
    shared_payable numeric(15,2) DEFAULT 0.00,
    deposit_reservation numeric(15,2) DEFAULT 0.00,
    cash_fo numeric(15,2) DEFAULT 0.00,
    cash_outlet numeric(15,2) DEFAULT 0.00,
    bank_transfer numeric(15,2) DEFAULT 0.00,
    qris numeric(15,2) DEFAULT 0.00,
    credit_debit_card numeric(15,2) DEFAULT 0.00,
    city_ledger numeric(15,2) DEFAULT 0.00,
    total_settlement numeric(15,2) DEFAULT 0.00,
    gab numeric(15,2) DEFAULT 0.00,
    balance numeric(15,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.budget_dsr OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 34506)
-- Name: budget_dsr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_dsr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_dsr_id_seq OWNER TO postgres;

--
-- TOC entry 5408 (class 0 OID 0)
-- Dependencies: 226
-- Name: budget_dsr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_dsr_id_seq OWNED BY public.budget_dsr.id;


--
-- TOC entry 225 (class 1259 OID 34490)
-- Name: budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgets (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    year integer NOT NULL,
    account_code character varying(100) NOT NULL,
    "values" jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.budgets OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 34489)
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budgets_id_seq OWNER TO postgres;

--
-- TOC entry 5409 (class 0 OID 0)
-- Dependencies: 224
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- TOC entry 233 (class 1259 OID 34622)
-- Name: dsr_opening_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dsr_opening_balances (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    effective_date date NOT NULL,
    balance_value numeric(15,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dsr_opening_balances OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 34621)
-- Name: dsr_opening_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dsr_opening_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dsr_opening_balances_id_seq OWNER TO postgres;

--
-- TOC entry 5410 (class 0 OID 0)
-- Dependencies: 232
-- Name: dsr_opening_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dsr_opening_balances_id_seq OWNED BY public.dsr_opening_balances.id;


--
-- TOC entry 262 (class 1259 OID 35245)
-- Name: guest_review_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_review_settings (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    logo_url text,
    header_text character varying(255) DEFAULT 'Bagaimana Pengalaman Menginap Anda?'::character varying,
    subheader_text text DEFAULT 'Kami sangat menghargai masukan Anda untuk menjadi lebih baik.'::text,
    promo_enabled boolean DEFAULT false,
    promo_title character varying(255),
    promo_description text,
    promo_image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.guest_review_settings OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 35244)
-- Name: guest_review_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guest_review_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_review_settings_id_seq OWNER TO postgres;

--
-- TOC entry 5411 (class 0 OID 0)
-- Dependencies: 261
-- Name: guest_review_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guest_review_settings_id_seq OWNED BY public.guest_review_settings.id;


--
-- TOC entry 258 (class 1259 OID 35200)
-- Name: guest_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_reviews (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    guest_name character varying(255) NOT NULL,
    room_number character varying(50),
    checkin_date date NOT NULL,
    rating smallint NOT NULL,
    cleanliness_rating smallint,
    service_rating smallint,
    facilities_rating smallint,
    comment text,
    status public.review_status DEFAULT 'pending'::public.review_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    guest_email character varying(255),
    reply_text text,
    replied_at timestamp with time zone,
    CONSTRAINT guest_reviews_cleanliness_rating_check CHECK (((cleanliness_rating >= 1) AND (cleanliness_rating <= 5))),
    CONSTRAINT guest_reviews_facilities_rating_check CHECK (((facilities_rating >= 1) AND (facilities_rating <= 5))),
    CONSTRAINT guest_reviews_overall_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT guest_reviews_service_rating_check CHECK (((service_rating >= 1) AND (service_rating <= 5)))
);


ALTER TABLE public.guest_reviews OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 35199)
-- Name: guest_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guest_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_reviews_id_seq OWNER TO postgres;

--
-- TOC entry 5412 (class 0 OID 0)
-- Dependencies: 257
-- Name: guest_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guest_reviews_id_seq OWNED BY public.guest_reviews.id;


--
-- TOC entry 222 (class 1259 OID 34461)
-- Name: hotels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotels (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    address text,
    brand character varying(100),
    city character varying(100),
    thumbnail_url text
);


ALTER TABLE public.hotels OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 34460)
-- Name: hotels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hotels_id_seq OWNER TO postgres;

--
-- TOC entry 5413 (class 0 OID 0)
-- Dependencies: 221
-- Name: hotels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotels_id_seq OWNED BY public.hotels.id;


--
-- TOC entry 248 (class 1259 OID 34753)
-- Name: inspection_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspection_items (
    id integer NOT NULL,
    inspection_type_id integer NOT NULL,
    category character varying(255),
    name text NOT NULL,
    standard text,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inspection_items OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 34752)
-- Name: inspection_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspection_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspection_items_id_seq OWNER TO postgres;

--
-- TOC entry 5414 (class 0 OID 0)
-- Dependencies: 247
-- Name: inspection_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspection_items_id_seq OWNED BY public.inspection_items.id;


--
-- TOC entry 252 (class 1259 OID 34801)
-- Name: inspection_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspection_results (
    id integer NOT NULL,
    inspection_id integer NOT NULL,
    item_id integer NOT NULL,
    result character varying(10),
    notes text,
    image_url character varying(255),
    priority public.task_priority DEFAULT 'medium'::public.task_priority
);


ALTER TABLE public.inspection_results OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 34800)
-- Name: inspection_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspection_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspection_results_id_seq OWNER TO postgres;

--
-- TOC entry 5415 (class 0 OID 0)
-- Dependencies: 251
-- Name: inspection_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspection_results_id_seq OWNED BY public.inspection_results.id;


--
-- TOC entry 254 (class 1259 OID 34840)
-- Name: inspection_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspection_tasks (
    id integer NOT NULL,
    inspection_id integer NOT NULL,
    item_id integer NOT NULL,
    hotel_id integer NOT NULL,
    description text NOT NULL,
    notes text,
    status public.task_status DEFAULT 'pending'::public.task_status,
    priority public.task_priority DEFAULT 'medium'::public.task_priority,
    assigned_to character varying(255),
    due_date date,
    completion_photo_url character varying(255),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inspection_tasks OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 34839)
-- Name: inspection_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspection_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspection_tasks_id_seq OWNER TO postgres;

--
-- TOC entry 5416 (class 0 OID 0)
-- Dependencies: 253
-- Name: inspection_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspection_tasks_id_seq OWNED BY public.inspection_tasks.id;


--
-- TOC entry 246 (class 1259 OID 34741)
-- Name: inspection_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspection_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inspection_types OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 34740)
-- Name: inspection_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspection_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspection_types_id_seq OWNER TO postgres;

--
-- TOC entry 5417 (class 0 OID 0)
-- Dependencies: 245
-- Name: inspection_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspection_types_id_seq OWNED BY public.inspection_types.id;


--
-- TOC entry 250 (class 1259 OID 34778)
-- Name: inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspections (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    inspection_type_id integer NOT NULL,
    room_number_or_area character varying(255),
    inspection_date timestamp with time zone DEFAULT now(),
    status public.inspection_status DEFAULT 'in_progress'::public.inspection_status,
    score numeric(5,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    pic_name character varying(255),
    inspector_id integer,
    notes text,
    inspector_name character varying(255)
);


ALTER TABLE public.inspections OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 34777)
-- Name: inspections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspections_id_seq OWNER TO postgres;

--
-- TOC entry 5418 (class 0 OID 0)
-- Dependencies: 249
-- Name: inspections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspections_id_seq OWNED BY public.inspections.id;


--
-- TOC entry 239 (class 1259 OID 34676)
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    action character varying(100) NOT NULL,
    group_name character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 34675)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- TOC entry 5419 (class 0 OID 0)
-- Dependencies: 238
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 260 (class 1259 OID 35221)
-- Name: review_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_media (
    id integer NOT NULL,
    review_id integer NOT NULL,
    file_path text NOT NULL,
    media_type character varying(20),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_media OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 35220)
-- Name: review_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_media_id_seq OWNER TO postgres;

--
-- TOC entry 5420 (class 0 OID 0)
-- Dependencies: 259
-- Name: review_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_media_id_seq OWNED BY public.review_media.id;


--
-- TOC entry 240 (class 1259 OID 34686)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 34662)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 34661)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5421 (class 0 OID 0)
-- Dependencies: 236
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 235 (class 1259 OID 34639)
-- Name: room_production; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_production (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    date date NOT NULL,
    segment character varying(255),
    company character varying(255),
    room integer DEFAULT 0,
    guest integer DEFAULT 0,
    arr numeric(15,2) DEFAULT 0,
    lodging_revenue numeric(15,2) DEFAULT 0,
    pic_name character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.room_production OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 34638)
-- Name: room_production_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_production_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_production_id_seq OWNER TO postgres;

--
-- TOC entry 5422 (class 0 OID 0)
-- Dependencies: 234
-- Name: room_production_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_production_id_seq OWNED BY public.room_production.id;


--
-- TOC entry 244 (class 1259 OID 34723)
-- Name: slides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.slides (
    id integer NOT NULL,
    hotel_id integer,
    title character varying(255) NOT NULL,
    link text NOT NULL,
    thumbnail_url text,
    "position" integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.slides OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 34722)
-- Name: slides_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.slides_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.slides_id_seq OWNER TO postgres;

--
-- TOC entry 5423 (class 0 OID 0)
-- Dependencies: 243
-- Name: slides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.slides_id_seq OWNED BY public.slides.id;


--
-- TOC entry 256 (class 1259 OID 35124)
-- Name: trial_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trial_balances (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    link text NOT NULL,
    status public.audit_status DEFAULT 'not_audited'::public.audit_status NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    thumbnail_url text,
    "position" integer,
    drive_folder_link text
);


ALTER TABLE public.trial_balances OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 35123)
-- Name: trial_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trial_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trial_balances_id_seq OWNER TO postgres;

--
-- TOC entry 5424 (class 0 OID 0)
-- Dependencies: 255
-- Name: trial_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trial_balances_id_seq OWNED BY public.trial_balances.id;


--
-- TOC entry 223 (class 1259 OID 34474)
-- Name: user_hotel_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_hotel_access (
    user_id integer NOT NULL,
    hotel_id integer NOT NULL
);


ALTER TABLE public.user_hotel_access OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 34446)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100),
    role public.user_role NOT NULL,
    hotel_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 34445)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5425 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4945 (class 2604 OID 34559)
-- Name: actual_dsr id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_dsr ALTER COLUMN id SET DEFAULT nextval('public.actual_dsr_id_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 34608)
-- Name: actuals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actuals ALTER COLUMN id SET DEFAULT nextval('public.actuals_id_seq'::regclass);


--
-- TOC entry 4998 (class 2604 OID 34705)
-- Name: ar_aging id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ar_aging ALTER COLUMN id SET DEFAULT nextval('public.ar_aging_id_seq'::regclass);


--
-- TOC entry 5044 (class 2604 OID 35325)
-- Name: audit_agendas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_agendas ALTER COLUMN id SET DEFAULT nextval('public.audit_agendas_id_seq'::regclass);


--
-- TOC entry 5048 (class 2604 OID 35353)
-- Name: audit_checklist_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_categories ALTER COLUMN id SET DEFAULT nextval('public.audit_checklist_categories_id_seq'::regclass);


--
-- TOC entry 5052 (class 2604 OID 35366)
-- Name: audit_checklist_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_items ALTER COLUMN id SET DEFAULT nextval('public.audit_checklist_items_id_seq'::regclass);


--
-- TOC entry 5057 (class 2604 OID 35393)
-- Name: audit_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results ALTER COLUMN id SET DEFAULT nextval('public.audit_results_id_seq'::regclass);


--
-- TOC entry 4900 (class 2604 OID 34428)
-- Name: books id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- TOC entry 4909 (class 2604 OID 34510)
-- Name: budget_dsr id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_dsr ALTER COLUMN id SET DEFAULT nextval('public.budget_dsr_id_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 34493)
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- TOC entry 4983 (class 2604 OID 34625)
-- Name: dsr_opening_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dsr_opening_balances ALTER COLUMN id SET DEFAULT nextval('public.dsr_opening_balances_id_seq'::regclass);


--
-- TOC entry 5038 (class 2604 OID 35248)
-- Name: guest_review_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_review_settings ALTER COLUMN id SET DEFAULT nextval('public.guest_review_settings_id_seq'::regclass);


--
-- TOC entry 5032 (class 2604 OID 35203)
-- Name: guest_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_reviews ALTER COLUMN id SET DEFAULT nextval('public.guest_reviews_id_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 34464)
-- Name: hotels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotels ALTER COLUMN id SET DEFAULT nextval('public.hotels_id_seq'::regclass);


--
-- TOC entry 5012 (class 2604 OID 34756)
-- Name: inspection_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_items ALTER COLUMN id SET DEFAULT nextval('public.inspection_items_id_seq'::regclass);


--
-- TOC entry 5021 (class 2604 OID 34804)
-- Name: inspection_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results ALTER COLUMN id SET DEFAULT nextval('public.inspection_results_id_seq'::regclass);


--
-- TOC entry 5023 (class 2604 OID 34843)
-- Name: inspection_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks ALTER COLUMN id SET DEFAULT nextval('public.inspection_tasks_id_seq'::regclass);


--
-- TOC entry 5009 (class 2604 OID 34744)
-- Name: inspection_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_types ALTER COLUMN id SET DEFAULT nextval('public.inspection_types_id_seq'::regclass);


--
-- TOC entry 5016 (class 2604 OID 34781)
-- Name: inspections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections ALTER COLUMN id SET DEFAULT nextval('public.inspections_id_seq'::regclass);


--
-- TOC entry 4997 (class 2604 OID 34679)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 5036 (class 2604 OID 35224)
-- Name: review_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media ALTER COLUMN id SET DEFAULT nextval('public.review_media_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 34665)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4987 (class 2604 OID 34642)
-- Name: room_production id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_production ALTER COLUMN id SET DEFAULT nextval('public.room_production_id_seq'::regclass);


--
-- TOC entry 5006 (class 2604 OID 34726)
-- Name: slides id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slides ALTER COLUMN id SET DEFAULT nextval('public.slides_id_seq'::regclass);


--
-- TOC entry 5028 (class 2604 OID 35127)
-- Name: trial_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trial_balances ALTER COLUMN id SET DEFAULT nextval('public.trial_balances_id_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 34449)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5353 (class 0 OID 34556)
-- Dependencies: 229
-- Data for Name: actual_dsr; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actual_dsr (id, hotel_id, date, room_available, room_ooo, room_com_and_hu, room_sold, number_of_guest, occp_r_sold_percent, arr, revpar, lodging_revenue, others_room_revenue, room_revenue, breakfast_revenue, restaurant_revenue, room_service, banquet_revenue, fnb_others_revenue, fnb_revenue, others_revenue, total_revenue, service, tax, gross_revenue, shared_payable, deposit_reservation, cash_fo, cash_outlet, bank_transfer, qris, credit_debit_card, city_ledger, total_settlement, gab, balance, created_at, updated_at) FROM stdin;
1	2	2025-11-30	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
2	2	2025-12-01	131	0	4	99	207	\N	422208.00	319073.00	41426722.31	371900.82	41798623.00	6553719.01	446281.00	80166.12	826446.28	\N	\N	0.00	49705236.00	4970523.55	5467575.91	60143335.00	0.00	0.00	1450000.00	332001.00	6600000.00	8405000.00	25318414.00	2725470.00	44830885.00	15312450.00	15312450.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
3	2	2025-12-02	131	0	1	108	219	\N	445052.00	366913.00	48065563.64	0.00	48065564.00	7074380.17	256198.35	125620.66	2768595.04	\N	\N	0.00	58290358.00	5829035.79	6411939.37	70531333.00	0.00	0.00	0.00	102001.00	2550000.00	3460000.00	27161326.00	18592293.00	51865620.00	18665713.00	33978163.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
4	2	2025-12-03	130	1	4	112	240	\N	472254.00	406865.00	52355255.37	537190.08	52892445.00	7074380.17	132231.40	417352.06	0.00	\N	\N	0.00	60516409.00	6051640.91	6656805.00	73224855.00	0.00	0.00	0.00	189996.00	31570000.00	4775000.00	39859804.00	7948305.00	84343105.00	-11118250.00	22859913.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
5	2	2025-12-04	131	0	3	122	261	\N	494920.00	460918.00	60008357.85	371900.82	60380259.00	7669421.49	157024.79	0.00	2148760.33	\N	\N	16528.93	70371994.00	7037199.42	7740919.36	85150113.00	0.00	0.00	0.00	160000.00	24750000.00	3950000.00	17800090.00	14816444.00	61476534.00	23673579.00	46533492.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
6	2	2025-12-05	131	0	0	133	273	\N	540085.00	548331.00	71087540.50	743801.65	71831342.00	8727272.73	231404.96	0.00	1446280.99	\N	\N	123966.94	82360268.00	8236026.78	9059629.46	99655924.00	0.00	0.00	3900000.00	0.00	14500000.00	4530000.00	29019421.00	13376860.00	65326281.00	34329643.00	80863135.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
7	2	2025-12-06	131	0	2	129	263	\N	556712.00	548213.00	69129923.97	2685950.41	71815874.00	9595041.32	380165.29	128099.17	826446.28	\N	\N	0.00	82745626.00	8274562.64	9102018.91	100122208.00	0.00	0.00	3250000.00	200000.00	27750000.00	9715000.00	38395113.00	38791042.00	118101155.00	-17978947.00	62884188.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
8	2	2025-12-07	131	0	0	69	138	\N	408121.00	214964.00	27953729.75	206611.57	28160341.00	5132231.40	909090.91	90909.09	0.00	\N	\N	49586.78	34342160.00	3434215.95	3777637.55	41554013.00	0.00	0.00	0.00	0.00	40042000.00	1460000.00	43143926.00	18750032.00	103395958.00	-61841945.00	1042243.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
9	2	2025-12-08	131	0	0	110	220	\N	449547.00	377482.00	48788991.74	661157.02	49450149.00	7140495.87	338842.98	0.00	1033057.85	\N	\N	0.00	57962545.00	5796254.55	6375880.00	70134680.00	0.00	0.00	600000.00	100000.00	2500000.00	8660000.00	37962618.00	7811662.00	57634280.00	12500400.00	13542643.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
10	2	2025-12-09	131	0	0	125	250	\N	493132.00	470546.00	59616736.36	2024793.39	61641530.00	8165289.26	462809.92	136363.64	3099173.55	\N	\N	0.00	73505166.00	7350516.61	8085568.27	88941251.00	0.00	0.00	0.00	65000.00	10650000.00	660000.00	23896510.00	11068455.00	46339965.00	42601286.00	56143929.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
11	2	2025-12-10	131	0	0	131	263	\N	485377.00	485377.00	63584372.73	0.00	63584373.00	8595041.32	318181.82	0.00	3636363.64	\N	\N	132231.40	76266191.00	7626619.09	8389281.00	92282091.00	0.00	0.00	1100000.00	305000.00	25800000.00	140000.00	15023712.00	45240865.00	87609577.00	4672514.00	60816443.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
12	2	2025-12-11	131	0	0	131	265	\N	521649.00	521649.00	67075748.76	1260330.57	68336079.00	8661157.02	0.00	0.00	1033057.85	\N	\N	0.00	78030294.00	7803029.42	8583332.36	94416656.00	0.00	0.00	7700000.00	0.00	34400000.00	5525000.00	28275057.00	31825615.00	107725672.00	-13309016.00	47507427.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
13	2	2025-12-12	131	0	0	131	265	\N	536320.00	536320.00	69307509.09	950413.22	70257922.00	8595041.32	53719.01	0.00	13429752.07	\N	\N	0.00	92336435.00	9233643.47	10157007.82	111727086.00	0.00	0.00	0.00	40000.00	8740000.00	4585000.00	59097844.00	28451427.00	100914271.00	10812815.00	58320242.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
14	2	2025-12-13	131	0	0	131	265	\N	617707.00	617707.00	76415494.21	4504132.23	80919626.00	9743801.65	619834.71	57850.41	0.00	\N	\N	82644.63	91423758.00	9142375.78	10056613.36	110622747.00	0.00	0.00	300000.00	0.00	44830000.00	4959999.00	32194772.00	13111182.00	95395953.00	15226794.00	73547036.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
15	2	2025-12-14	131	0	2	102	209	\N	418729.00	326033.00	40561549.59	2148760.33	42710310.00	6545454.55	586776.86	261984.30	2975206.61	\N	\N	41322.31	53121055.00	5312105.46	5843316.00	64276476.00	0.00	0.00	0.00	0.00	13050000.00	7915712.00	50162812.00	30794264.00	101922788.00	-37646312.00	35900724.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
16	2	2025-12-15	131	0	2	105	217	\N	431474.00	345838.00	43817204.96	1487603.31	45304808.00	6942148.76	677685.95	0.00	5123966.94	\N	\N	0.00	58048610.00	5804860.99	6385347.09	70238818.00	0.00	0.00	1050000.00	0.00	8950000.00	5720000.00	46251224.00	13183028.00	75154252.00	-4915434.00	30985290.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
17	2	2025-12-16	131	0	0	116	237	\N	447517.00	396274.00	51209475.21	702479.34	51911955.00	7570247.93	677685.95	0.00	1652892.56	\N	\N	0.00	61812781.00	6181278.10	6799405.91	74793465.00	0.00	0.00	2150000.00	0.00	14550000.00	4620000.00	31733753.00	16745681.00	69799434.00	4994031.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
18	2	2025-12-17	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
19	2	2025-12-18	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
20	2	2025-12-19	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
21	2	2025-12-20	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
22	2	2025-12-21	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
23	2	2025-12-22	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
24	2	2025-12-23	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
25	2	2025-12-24	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
26	2	2025-12-25	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
27	2	2025-12-26	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
28	2	2025-12-27	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
29	2	2025-12-28	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
30	2	2025-12-29	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
31	2	2025-12-30	0	0	0	0	0	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	35979321.00	2025-12-17 17:02:00.620624+07	2025-12-17 17:02:00.620624+07
\.


--
-- TOC entry 5355 (class 0 OID 34605)
-- Dependencies: 231
-- Data for Name: actuals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actuals (id, hotel_id, year, account_code, "values", created_at) FROM stdin;
1	1	2025	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 0]	2025-12-14 16:05:53.235491+07
2	1	2025	stat_room_available	[6014, 5432, 6014, 5820, 6014, 5820, 6014, 6014, 5820, 6014, 5820, 0]	2025-12-14 16:05:53.235491+07
3	1	2025	stat_occupied_rooms	[4019, 3267, 1078, 3157, 3523, 3246, 4518, 3698, 3248, 4539, 3893, 0]	2025-12-14 16:05:53.235491+07
4	1	2025	stat_guests	[9186, 7431, 2169, 6583, 7552, 6772, 9231, 7510, 6651, 9431, 8433, 0]	2025-12-14 16:05:53.235491+07
5	1	2025	rev_room	[1479257038, 1114570182, 358842962, 1159638335, 1198026768, 1088073790, 1598589725, 1197672732, 1086780900, 1490586462, 1325323513, 0]	2025-12-14 16:05:53.235491+07
6	1	2025	rev_fnb	[502012650, 578414494, 685434031, 384577479, 438558948, 354646540, 525451068, 699008732, 526458388, 1088975254, 898525963, 0]	2025-12-14 16:05:53.235491+07
7	1	2025	rev_others	[1074381, 661158, 56199, 812262, 1819140, 1293390, 2439934, 4590760, 4590993, 1630623, 1314743, 0]	2025-12-14 16:05:53.235491+07
8	1	2025	cos_fnb	[148135173.83, 211725328.16, 259204466.64, 131070397.08, 153122609.3, 132343988.24, 197889235.84, 243087807.51, 195327301.8, 369872201.94, 282483038.76, 0]	2025-12-14 16:05:53.235491+07
9	1	2025	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 350000, 0, 0, 0]	2025-12-14 16:05:53.235491+07
10	1	2025	osaw_room	[118368755, 112811224, 123473291, 95620068, 91127778, 99543930, 106732778, 97105737, 99658532, 101654346, 89866682, 0]	2025-12-14 16:05:53.235491+07
11	1	2025	osaw_fnb	[99246203, 100359800, 123007865, 88999568.01, 82866236.33, 80609481, 87302416, 87958297, 84962473, 94922383, 92985146, 0]	2025-12-14 16:05:53.235491+07
12	1	2025	ooe_room	[146510574.68, 105897301.31, 40242336.24, 104994845.26, 110896609.53, 106775000.63, 128923757.45, 107956261.4, 110043858.49, 118960774.7, 119326519.48, 0]	2025-12-14 16:05:53.235491+07
13	1	2025	ooe_fnb	[18673438.88, 22779134.83, 62906478.48, 21014900.26, 33138778.93, 27228774.14, 33098511.11, 48861063.47, 32421394.6, 54612886.69, 36765089.01, 0]	2025-12-14 16:05:53.235491+07
14	1	2025	usaw_ag	[62637518, 64761762, 101562959, 59487569, 43924561, 56655432.24, 64043334.2, 60443847, 56683346, 55927044.8, 63722707, 0]	2025-12-14 16:05:53.235491+07
15	1	2025	usaw_sm	[28590459, 17336058, 14995333, 21332383, 26860752, 21393841.2, 17945076, 13752070, 26605145, 27601780, 26185897, 0]	2025-12-14 16:05:53.235491+07
16	1	2025	usaw_pomec	[31628531, 31497848, 45072315, 28901997, 25807737, 29576911, 29969725, 31501243.97, 33088990, 32229008, 31312295, 0]	2025-12-14 16:05:53.235491+07
17	1	2025	uoe_ag	[47060588.34, 41717935.47, 46612963.59, 52854213.2, 47921445.45, 53987212.12, 53089271.56, 46700351.54, 64949329.87, 51776440.76, 45814552.46, 0]	2025-12-14 16:05:53.235491+07
18	1	2025	uoe_sm	[14211486.06, 20964659.63, 19785035, 9662640, 16576558.35, 14471571.12, 24016872.7, 13594744.41, 19622659.7, 36690829.3, 18910785.54, 0]	2025-12-14 16:05:53.235491+07
19	1	2025	uoe_pomec	[34344688.85, 42453313.68, 22149999.07, 38457554.44, 37726473.78, 36034270.83, 57221701.12, 52388066.63, 38669140.9, 55917513.57, 25962091.92, 0]	2025-12-14 16:05:53.235491+07
20	1	2025	uoe_energy	[191621413, 172288853, 102999678, 172592441, 183222099, 169792335, 202698261, 186395981, 167528138, 224431499, 202815408, 0]	2025-12-14 16:05:53.235491+07
21	1	2025	mgt_fee	[154028135, 131596281, 81144689, 120048681, 127304057, 112199865.66, 165227552.83, 147728852, 125705413, 200558645, 182465533, 0]	2025-12-14 16:05:53.235491+07
22	2	2025	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 0]	2025-12-14 19:21:57.927211+07
23	2	2025	stat_room_available	[4049, 3640, 4033, 3930, 4061, 3930, 4061, 3463, 3068, 3373, 3734, 0]	2025-12-14 19:21:57.927211+07
24	2	2025	stat_occupied_rooms	[3248, 2757, 842, 2636, 3098, 3263, 3612, 2973, 2566, 3029, 3278, 0]	2025-12-14 19:21:57.927211+07
25	2	2025	stat_guests	[6788, 5564, 1708, 5396, 6345, 6614, 7395, 6063, 5185, 6190, 6780, 0]	2025-12-14 19:21:57.927211+07
26	2	2025	rev_room	[1530680484, 1085848933, 340690859, 1211227010, 1307412044, 1428212966, 1524938422, 1207848348, 1058392432, 1266972808, 1527913377, 0]	2025-12-14 19:21:57.927211+07
27	2	2025	rev_fnb	[306147962, 248218203, 219329667, 211421819, 310632314, 231350123, 325002726, 261658668, 204904955, 289928592, 350192910, 0]	2025-12-14 19:21:57.927211+07
28	2	2025	rev_others	[1723142, 1404959, 59994, 695869, 2090911, 1334715, 3648762, 2264464, 1033061, 2865291, 1247939, 0]	2025-12-14 19:21:57.927211+07
29	2	2025	cos_fnb	[105974104.8, 86506893.76, 76462461.06, 74315868.83, 102336014.01, 77588374.18, 110048795.76, 87883709.22, 69198349.44, 103868167.16, 118021827.16, 0]	2025-12-14 19:21:57.927211+07
30	2	2025	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:21:57.927211+07
31	2	2025	osaw_room	[83454656.48, 84668204.4, 74389566.37, 69933305.07, 75849678.58, 80382691.27, 83538176.19, 79837688.64, 76731991.05, 80306893.73, 88769398.78, 0]	2025-12-14 19:21:57.927211+07
32	2	2025	osaw_fnb	[58857803.44, 53691686.79, 67469695.08, 53338707.97, 53628452.85, 57527672.85, 64093265.76, 60994499.15, 58866676.61, 56886043.42, 64022204.28, 0]	2025-12-14 19:21:57.927211+07
66	4	2025	stat_occupied_rooms	[1161, 1089, 338, 1293, 1453, 1179, 1062, 1062, 1037, 1671, 1442, 0]	2025-12-14 19:25:49.203941+07
33	2	2025	ooe_room	[173614693.52, 113542690.92, 38632242.04, 106429581.71, 97287393.41, 140219672.53, 153950405.19, 111923811.67, 85622397.11, 97963313.47, 105017545.45, 0]	2025-12-14 19:21:57.927211+07
34	2	2025	ooe_fnb	[15881618.04, 10780210.54, 20359705.47, 23882138.12, 26591501.54, 26603350.86, 30108978.09, 33668377.43, 30746923.95, 33067055.71, 38898686.46, 0]	2025-12-14 19:21:57.927211+07
35	2	2025	usaw_ag	[62287299.33, 62490014.33, 84303520.78, 58230381.37, 62019656.41, 63096742.57, 63339938.22, 63874809.45, 67123211.12, 66472664.94, 69173424.1, 0]	2025-12-14 19:21:57.927211+07
36	2	2025	usaw_sm	[17773083.78, 20929966.09, 23908044.21, 17536702.47, 15848953.03, 16485317.54, 16557032.68, 16914710.47, 16252589.31, 7478721.2, 8110474.01, 0]	2025-12-14 19:21:57.927211+07
37	2	2025	usaw_pomec	[23421475.95, 23092409.88, 31307666.75, 22902587.76, 24081762.19, 24846612.92, 25641966.04, 23338150.92, 27443111.08, 25280947.61, 23475437.29, 0]	2025-12-14 19:21:57.927211+07
38	2	2025	uoe_ag	[33822854.31, 26413536.38, 27552810.07, 40231817.81, 32203991.23, 44706711.01, 37039268.69, 35171811.76, 48455344.35, 40627351.59, 40188064.43, 0]	2025-12-14 19:21:57.927211+07
39	2	2025	uoe_sm	[20131506.42, 18306237.71, 16279895.22, 14143927.2, 16610197.32, 17589558.63, 14624526.8, 13654153.44, 17518703.61, 22254139.65, 19588986.96, 0]	2025-12-14 19:21:57.927211+07
40	2	2025	uoe_pomec	[32675474.9, 23340146.78, 13369007.39, 30438288.78, 25407946.15, 22080449.04, 34690945.91, 33301386.53, 45724129.59, 43646228.88, 36363518.34, 0]	2025-12-14 19:21:57.927211+07
41	2	2025	uoe_energy	[103122998.76, 93300570.34, 52999939.88, 77753443.11, 94057643.22, 83385496.2, 92147763.62, 86703690.77, 92867903.98, 94958474.78, 126315363.91, 0]	2025-12-14 19:21:57.927211+07
42	2	2025	mgt_fee	[102039613, 74118701, 31084469, 78995631, 89917507, 92179828, 102874240, 81683317, 70170340, 86567051, 104304159, 0]	2025-12-14 19:21:57.927211+07
43	3	2025	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 0]	2025-12-14 19:23:38.128567+07
44	3	2025	stat_room_available	[3379, 3052, 3379, 3270, 3379, 3270, 3379, 3379, 3270, 3379, 0, 0]	2025-12-14 19:23:38.128567+07
45	3	2025	stat_occupied_rooms	[1760, 1240, 608, 1489, 1704, 1476, 1654, 1442, 1280, 1608, 0, 0]	2025-12-14 19:23:38.128567+07
46	3	2025	stat_guests	[3763, 2887, 1233, 3060, 3784, 3107, 3380, 2929, 2629, 3429, 0, 0]	2025-12-14 19:23:38.128567+07
47	3	2025	rev_room	[591285620, 386644070, 176584391, 533763406, 547179561, 452281442, 515184862, 423965698, 395977340, 509523215, 162597076, 0]	2025-12-14 19:23:38.128567+07
48	3	2025	rev_fnb	[69502071, 76026860, 30309925, 48479340, 83969016, 59828512, 72303724, 40008268, 29183884, 63559918, 31479343, 0]	2025-12-14 19:23:38.128567+07
49	3	2025	rev_others	[272730, 161156, 466943, 214878, 247937, 214879, 909093, 404961, 603308, 1028930, 516531, 0]	2025-12-14 19:23:38.128567+07
50	3	2025	cos_fnb	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:23:38.128567+07
51	3	2025	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:23:38.128567+07
52	3	2025	osaw_room	[50900258, 45897758, 55320119, 45463367, 48923480, 57862041, 46790998, 48214982, 45503013, 46669763, 59446906, 0]	2025-12-14 19:23:38.128567+07
53	3	2025	osaw_fnb	[5657691, 5317191, 8773333, 5288126, 5375691, 6711791, 5363010, 5520773, 5325773, 5515843, 10269342, 0]	2025-12-14 19:23:38.128567+07
54	3	2025	ooe_room	[89681843.38, 73863345.16, 31550818.23, 76474660.96, 74708707, 83094304.39, 96287664.72, 84425577.01, 65277624.4, 75810549.28, 28597153.97, 0]	2025-12-14 19:23:38.128567+07
55	3	2025	ooe_fnb	[1921742.77, 1031759.4, 220333.5, 578969, 1982914.33, 957750, 705760, 1721879, 368750, 502100, 262757.34, 0]	2025-12-14 19:23:38.128567+07
56	3	2025	usaw_ag	[53670451, 51100463, 75560869, 49109092, 49688194, 58486685, 50934214, 51430295, 48696907, 52538008, 82691736, 0]	2025-12-14 19:23:38.128567+07
57	3	2025	usaw_sm	[0, 0, 0, 2654703, 5187414, 5170000, 5434245, 5138439, 1479032, 0, 0, 0]	2025-12-14 19:23:38.128567+07
58	3	2025	usaw_pomec	[16405400, 16164900, 24142472, 16939545, 15725650, 19633242, 17620270, 17598173, 16644145, 17401314, 26381564, 0]	2025-12-14 19:23:38.128567+07
59	3	2025	uoe_ag	[38470378.17, 26733790.17, 25898205.49, 29676236.19, 25878497.35, 30769609.93, 27811696.26, 35546011.61, 26506178.09, 28300418.24, 33780238.55, 0]	2025-12-14 19:23:38.128567+07
60	3	2025	uoe_sm	[6391123, 3120055, 3408734, 6614083.64, 6206208, 10054002, 6533291.92, 5327296.25, 3131970, 5051059, 5339433, 0]	2025-12-14 19:23:38.128567+07
61	3	2025	uoe_pomec	[13733314.41, 11964179.32, 10244409.67, 14310860.83, 16383770.8, 17724105.15, 15815225.72, 19458769.13, 14064241.65, 17254214.33, 13984314.5, 0]	2025-12-14 19:23:38.128567+07
62	3	2025	uoe_energy	[94051287.09, 77957092.18, 60892640.1, 73586452.91, 86727912.73, 62987126.02, 69972832.7, 67938706.01, 69688295.5, 66428835.78, 33978450.62, 0]	2025-12-14 19:23:38.128567+07
63	3	2025	mgt_fee	[33053021, 23141604, 10368063, 29122881, 31569826, 25616242, 29419884, 23218946, 21288227, 28705603, 6717082, 0]	2025-12-14 19:23:38.128567+07
64	4	2025	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 0]	2025-12-14 19:25:49.203941+07
65	4	2025	stat_room_available	[3069, 2772, 3069, 2970, 3069, 2970, 3069, 3069, 2970, 3069, 2970, 0]	2025-12-14 19:25:49.203941+07
67	4	2025	stat_guests	[2347, 2361, 677, 2717, 3078, 2834, 2347, 2282, 2213, 3708, 2967, 0]	2025-12-14 19:25:49.203941+07
68	4	2025	rev_room	[406843894, 338419451, 105057577, 454973222, 455502600, 396564026, 370559001, 329886929, 312907813, 500579331, 451975255, 0]	2025-12-14 19:25:49.203941+07
69	4	2025	rev_fnb	[31301659, 41958675, 18471079, 22334711, 29973308, 48669092, 23838268, 15169422, 22975206, 30333880, 24132232, 0]	2025-12-14 19:25:49.203941+07
70	4	2025	rev_others	[25991735, 28103307, 27438016, 30107439, 24185950, 27768595, 30347109, 30136364, 31033058, 30851240, 28991736, 0]	2025-12-14 19:25:49.203941+07
71	4	2025	cos_fnb	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:25:49.203941+07
72	4	2025	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:25:49.203941+07
73	4	2025	osaw_room	[52710722, 51243849, 60655907, 49121241, 50269930, 50297547, 43071703, 47391143, 48537868, 55617990, 55189454, 0]	2025-12-14 19:25:49.203941+07
74	4	2025	osaw_fnb	[4634418, 4619418, 8277327, 4317834, 4499675, 4634418, 4629418, 4789418, 5014759, 5146995, 5136995, 0]	2025-12-14 19:25:49.203941+07
75	4	2025	ooe_room	[36694869.86, 37854468.12, 12125921.98, 37292634.05, 35916463.56, 37044972.95, 35074557.99, 33067976.2, 33804742.59, 45671314.47, 38957776.34, 0]	2025-12-14 19:25:49.203941+07
76	4	2025	ooe_fnb	[216674.77, 1604540.53, 10000, 89469.98, 298898.83, 263503, 873742.39, 1254818.05, 923646.6, 442866.66, 1134404.8, 0]	2025-12-14 19:25:49.203941+07
77	4	2025	usaw_ag	[51332166, 50650266, 75103905, 48946217, 46773774, 46259931, 42445577, 44469654, 53262526, 54903254, 43100845, 0]	2025-12-14 19:25:49.203941+07
78	4	2025	usaw_sm	[17146581, 16373859, 27644924, 17267488, 19510593, 13064407, 15518011, 15318694, 16134674, 10727013, 10312126, 0]	2025-12-14 19:25:49.203941+07
79	4	2025	usaw_pomec	[17414216, 17639216, 22248362, 14900124, 15731018, 15421664, 16469216, 19317383, 17538330, 17479795, 17834370, 0]	2025-12-14 19:25:49.203941+07
80	4	2025	uoe_ag	[29741375.83, 28156241.96, 30245238.88, 34338229.05, 29376834.04, 30993478.87, 37088242.96, 26060394, 48183087.58, 29114254.88, 28177606.76, 0]	2025-12-14 19:25:49.203941+07
81	4	2025	uoe_sm	[7813592.01, 20571120.83, 6847643, 3028704.03, 6689217.03, 7961935.38, 6510937.52, 5187131.68, 5919134.34, 5441400, 11273690.13, 0]	2025-12-14 19:25:49.203941+07
82	4	2025	uoe_pomec	[11614917.43, 12235498.48, 29221595.17, 11565170.99, 15866689.72, 16751265.66, 26019548.42, 19676596.94, 16767729.31, 20572049.14, 15907888.84, 0]	2025-12-14 19:25:49.203941+07
83	4	2025	uoe_energy	[43768342, 49466544, 27371623, 59375231, 53551624, 35729897, 46440007, 42923967, 38892628, 57836487, 47724089, 0]	2025-12-14 19:25:49.203941+07
84	4	2025	mgt_fee	[36063467, 31739007, 11730110, 39426174, 39600726, 36752233, 33002638, 29152474, 28509379, 43649098, 39246210, 0]	2025-12-14 19:25:49.203941+07
\.


--
-- TOC entry 5366 (class 0 OID 34702)
-- Dependencies: 242
-- Data for Name: ar_aging; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ar_aging (id, hotel_id, year, month, company_name, invoice_number, invoice_date, total_bill, current, days_1_30, days_31_60, days_61_90, days_over_90, remarks, created_at) FROM stdin;
41	1	2025	11	F&B Mandiri	51559	2025-11-30	100000.00	100000.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
42	1	2025	11	F/O Mandiri	266384	2025-11-30	500000.00	500000.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
43	1	2025	11	F/O Mandiri	266460	2025-11-30	5946354.00	5946354.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
44	1	2025	11	F/O Mandiri	266474	2025-11-30	600000.00	600000.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
45	1	2025	11	PERTAMINA PDC JAKARTA,	265316	2025-11-20	25800000.00	25800000.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
46	1	2025	11	SAVOY HOMAN,	264592	2025-10-27	10700000.00	0.00	10700000.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
47	1	2025	11	TIKET.COM,	266411	2025-11-29	1029458.00	1029458.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
48	1	2025	11	TIKET.COM,	266423	2025-11-28	532237.00	532237.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
49	1	2025	11	TIKET.COM,	266425	2025-11-28	532237.00	532237.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
50	1	2025	11	TIKET.COM,	266433	2025-11-28	532238.00	532238.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
51	1	2025	11	TIKET.COM,	266462	2025-11-29	1092488.00	1092488.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
52	1	2025	11	Traveloka (Tera),,	266459	2025-11-29	619164.00	619164.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
53	1	2025	11	Traveloka (Tera),,	266467	2025-11-29	583538.00	583538.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
54	1	2025	11	DP3A KOTA BANDUNG,	262353	2025-09-29	42000000.00	0.00	0.00	42000000.00	0.00	0.00		2025-12-14 16:28:07.049172+07
55	1	2025	11	GMNI,	258896	2025-07-21	135200000.00	0.00	0.00	0.00	135200000.00	0.00	Bermasalah	2025-12-14 16:28:07.049172+07
56	1	2025	11	GMNI,	259266	2025-07-23	2000000.00	0.00	0.00	0.00	2000000.00	0.00	Bermasalah	2025-12-14 16:28:07.049172+07
57	1	2025	11	KAGUM E-BOOKING,	218080	2023-11-06	-407000.00	0.00	0.00	0.00	-407000.00	0.00		2025-12-14 16:28:07.049172+07
58	1	2025	11	KAGUM E-BOOKING,	218081	2023-11-06	-432000.00	0.00	0.00	0.00	-432000.00	0.00		2025-12-14 16:28:07.049172+07
59	1	2025	11	KAGUM E-BOOKING,	265929	2025-11-16	471800.00	471800.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
60	1	2025	11	KAGUM E-BOOKING,	266238	2025-11-27	380880.00	380880.00	0.00	0.00	0.00	0.00		2025-12-14 16:28:07.049172+07
\.


--
-- TOC entry 5388 (class 0 OID 35322)
-- Dependencies: 264
-- Data for Name: audit_agendas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_agendas (id, date, hotel_id, auditor, status, notes, created_at, updated_at) FROM stdin;
1	2025-12-13	2	Asep	on_progress	Periksa dokumen	2025-12-19 05:37:42.972938+07	2025-12-19 06:12:51.966319+07
\.


--
-- TOC entry 5390 (class 0 OID 35350)
-- Dependencies: 266
-- Data for Name: audit_checklist_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_checklist_categories (id, name, "position", created_at, updated_at) FROM stdin;
1	Dokumen Income Audit	0	2025-12-19 06:05:18.149896+07	2025-12-19 06:05:18.149896+07
\.


--
-- TOC entry 5392 (class 0 OID 35363)
-- Dependencies: 268
-- Data for Name: audit_checklist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_checklist_items (id, category_id, name, standard, "position", is_active, created_at, updated_at) FROM stdin;
1	1	Daily Sales Report	Apakah DSR sesuai dengan Guest Account Balance	0	t	2025-12-19 06:07:06.391029+07	2025-12-19 06:08:56.61476+07
2	1	Jurnal Income	Apakah jurnal income audit sudah sesuai dan ditanda tangani	0	t	2025-12-19 06:09:53.383039+07	2025-12-19 06:09:53.383039+07
\.


--
-- TOC entry 5394 (class 0 OID 35390)
-- Dependencies: 270
-- Data for Name: audit_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_results (id, agenda_id, item_id, result, notes, image_url, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5342 (class 0 OID 34425)
-- Dependencies: 218
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, title, file_paths, thumbnail_url, created_at, hotel_id) FROM stdin;
5	Budget 2026 Golden Flower	["pdfFiles-1766045278246-689076014.pdf", "pdfFiles-1766045278251-6464975.pdf", "pdfFiles-1766045278255-80779510.pdf", "pdfFiles-1766045278260-315985712.pdf", "pdfFiles-1766045278264-427390833.pdf", "pdfFiles-1766045278273-131528391.pdf", "pdfFiles-1766045278278-398321767.pdf", "pdfFiles-1766045278283-669268243.pdf", "pdfFiles-1766045278288-774546389.pdf"]	thumb-1766045278291.png	2025-12-18 15:07:58.330155+07	\N
\.


--
-- TOC entry 5351 (class 0 OID 34507)
-- Dependencies: 227
-- Data for Name: budget_dsr; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_dsr (id, hotel_id, date, room_available, room_ooo, room_com_and_hu, room_sold, number_of_guest, occp_r_sold_percent, arr, revpar, lodging_revenue, others_room_revenue, room_revenue, breakfast_revenue, restaurant_revenue, room_service, banquet_revenue, fnb_others_revenue, fnb_revenue, others_revenue, total_revenue, service, tax, gross_revenue, shared_payable, deposit_reservation, cash_fo, cash_outlet, bank_transfer, qris, credit_debit_card, city_ledger, total_settlement, gab, balance, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5349 (class 0 OID 34490)
-- Dependencies: 225
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (id, hotel_id, year, account_code, "values", created_at) FROM stdin;
1	1	2025	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 0]	2025-12-14 16:08:06.617559+07
2	1	2025	stat_room_available	[6014, 5432, 6014, 5820, 6014, 5820, 6014, 6014, 5820, 6014, 5820, 0]	2025-12-14 16:08:06.617559+07
3	1	2025	stat_occupied_rooms	[2430.94, 2416.64, 1525.29, 4089.7, 4528.22, 4313.72, 4532.51, 4289.89, 4766.55, 4933.38, 4814.21, 0]	2025-12-14 16:08:06.617559+07
4	1	2025	stat_guests	[4861.88, 4833.28, 3050.59, 8179.39, 9056.44, 8627.45, 9065.02, 8579.78, 9533.09, 9866.75, 9628.42, 0]	2025-12-14 16:08:06.617559+07
5	1	2025	rev_room	[879810943.98, 906130430.31, 475582843.04, 1562150941.85, 1729654306.24, 1617451754.3, 1731292926.11, 1337576746.04, 1725253633.03, 1785637510.19, 1838895630.84, 0]	2025-12-14 16:08:06.617559+07
6	1	2025	rev_fnb	[900308130.35, 973850936.18, 675343607.1, 1289215263.12, 1186929608, 1093002258.08, 1123739713.54, 1001733841.19, 852426589.53, 1142927958.92, 1136360252.05, 0]	2025-12-14 16:08:06.617559+07
7	1	2025	rev_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 16:08:06.617559+07
8	1	2025	cos_fnb	[270306489.88, 291563766.73, 202710996.82, 387305346.42, 356576745.5, 328359141.89, 339593271.57, 300940334.14, 256085531.18, 343357793.75, 340134727.44, 0]	2025-12-14 16:08:06.617559+07
9	1	2025	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 16:08:06.617559+07
10	1	2025	osaw_room	[119622555.06, 119622555.06, 171116711.06, 124169822.89, 126726782.89, 124169822.89, 126726782.89, 124169822.89, 126726782.89, 126726782.89, 126726782.89, 0]	2025-12-14 16:08:06.617559+07
11	1	2025	osaw_fnb	[98123835.06, 88305727.65, 135886211.65, 90793612.44, 90793612.44, 90793612.44, 90793612.44, 90793612.44, 90793612.44, 90793612.44, 90793612.44, 0]	2025-12-14 16:08:06.617559+07
12	1	2025	ooe_room	[87900729.4, 90995655.58, 53591741, 142991821.2, 157329601.61, 149698528.89, 157469621.29, 143529868.02, 163175112.99, 168578175.74, 166639589.42, 0]	2025-12-14 16:08:06.617559+07
13	1	2025	ooe_fnb	[19246995.47, 20420963.48, 15434216.3, 25324329.99, 23650025.33, 22165654.66, 22638786.64, 20708365.55, 18278845.72, 22911443.98, 22816501.63, 0]	2025-12-14 16:08:06.617559+07
14	1	2025	usaw_ag	[59925531.55, 59925531.55, 107193587.92, 60920685.47, 60920685.47, 60920685.47, 60920685.47, 60920685.47, 60920685.47, 60920685.47, 60920685.47, 0]	2025-12-14 16:08:06.617559+07
15	1	2025	usaw_sm	[30149681.96, 30149681.96, 55632769.96, 30149681.96, 30149681.96, 30149681.96, 30149681.96, 30149681.96, 30149681.96, 30149681.96, 30149681.96, 0]	2025-12-14 16:08:06.617559+07
16	1	2025	usaw_pomec	[32310624.25, 24510624.25, 52022004.25, 26500932.08, 26500932.08, 26500932.08, 26500932.08, 26500932.08, 26500932.08, 26500932.08, 26500932.08, 0]	2025-12-14 16:08:06.617559+07
17	1	2025	uoe_ag	[42577686.02, 39122303.07, 35336674.27, 44318861.89, 44688625.34, 43572027.27, 44362403.58, 41629076.71, 42868326.18, 44752127.58, 44975477.18, 0]	2025-12-14 16:08:06.617559+07
18	1	2025	uoe_sm	[37773509.79, 37823324.02, 37458796.56, 38309016.44, 38341625.29, 38238560.34, 38310849.65, 38052988.63, 38172173.44, 38347616.07, 39620961.27, 0]	2025-12-14 16:08:06.617559+07
19	1	2025	uoe_pomec	[25327886.06, 26048531.88, 12249634.44, 33074882.22, 33546623.65, 32055617.36, 33101402.76, 29371013.25, 31095220.28, 33633290.23, 33971017.55, 0]	2025-12-14 16:08:06.617559+07
20	1	2025	uoe_energy	[96994442.63, 96423887.09, 59808668.74, 163178885.84, 180675922.55, 172117589.37, 180847089.21, 171166663.47, 190185181.63, 196841662.99, 192087033.44, 0]	2025-12-14 16:08:06.617559+07
21	1	2025	mgt_fee	[138333421.22, 146074552.18, 89426985.18, 221551154.13, 226618570.14, 210602276.76, 221836036.1, 181764432.63, 200285753.29, 227549536.95, 231177382.1, 0]	2025-12-14 16:08:06.617559+07
22	2	2026	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]	2025-12-14 19:21:07.429348+07
23	2	2026	stat_room_available	[3193, 2884, 3193, 3090, 3193, 3090, 3193, 3193, 3090, 3193, 3090, 3193]	2025-12-14 19:21:07.429348+07
24	2	2026	stat_occupied_rooms	[2267, 1814, 2252, 2237, 2418, 2418, 2494, 2660, 2690, 3023, 2932, 3023]	2025-12-14 19:21:07.429348+07
25	2	2026	stat_guests	[3400, 2720, 3378, 3355, 3627, 3627, 3741, 3990, 4035, 4534, 4398, 4534]	2025-12-14 19:21:07.429348+07
26	2	2026	rev_room	[1126062279, 855408556, 1118710406, 1111202283, 1201299765, 1201299765, 1238840383, 1321429742, 1552733874, 1979068061, 1919696019, 2048419921]	2025-12-14 19:21:07.429348+07
27	2	2026	rev_fnb	[232653891, 215933030, 320788186, 242798473, 446202718, 451491974, 456406883, 467219684, 469185647, 490811248, 484913357, 417468045]	2025-12-14 19:21:07.429348+07
28	2	2026	rev_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:21:07.429348+07
29	2	2026	cos_fnb	[76736115, 71218230, 105820432, 80077215, 147194004, 148926236, 150548156, 154116380, 154765148, 161901596, 159955292, 137698339]	2025-12-14 19:21:07.429348+07
30	2	2026	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:21:07.429348+07
31	2	2026	osaw_room	[76414396, 76414396, 116679559, 78931715, 78931715, 80231715, 80231715, 80231715, 80231715, 80231715, 80231715, 80231715]	2025-12-14 19:21:07.429348+07
32	2	2026	osaw_fnb	[85207389, 85207389, 137072552, 88022111, 88022111, 88022111, 88022111, 88022111, 88022111, 88022111, 88022111, 88022111]	2025-12-14 19:21:07.429348+07
33	2	2026	ooe_room	[113410859.96, 89716696.76, 112783341.28, 112155822.59, 119686046.79, 119686046.79, 122823640.21, 129726345.73, 137437737.86, 159038834.56, 154846161.25, 158414039.33]	2025-12-14 19:21:07.429348+07
34	2	2026	ooe_fnb	[19081350.87, 18527936.64, 24133811.46, 19210046.34, 32014100.52, 32326497.21, 32636136.5, 33317342.93, 33441198.65, 34903611.51, 34532044.36, 31282989.7]	2025-12-14 19:21:07.429348+07
35	2	2026	usaw_ag	[67422201, 67422201, 111809437, 75307372, 75307373, 75307373, 75307373, 75307373, 75307373, 75307373, 75307373, 75307373]	2025-12-14 19:21:07.429348+07
36	2	2026	usaw_sm	[26809774, 26809774, 47728392, 27945028, 27945028, 27945028, 27945028, 27945028, 27945028, 27945028, 27945028, 27945028]	2025-12-14 19:21:07.429348+07
37	2	2026	usaw_pomec	[29214918, 29214918, 47742845, 30220428, 30220428, 30220428, 30220428, 30220428, 30220428, 30220428, 30220428, 30220428]	2025-12-14 19:21:07.429348+07
38	2	2026	uoe_ag	[32163882, 30446151, 32632421, 32119547, 58838843, 39852534, 40115763, 40657495, 41993476, 44608629, 44213077, 44585479]	2025-12-14 19:21:07.429348+07
39	2	2026	uoe_sm	[26291617, 26291617, 26291617, 26291617, 26291617, 26291617, 26291617, 26291617, 26291617, 26291617, 26291617, 26291617]	2025-12-14 19:21:07.429348+07
40	2	2026	uoe_pomec	[32025825, 32025825, 32025825, 32025825, 32025825, 32025825, 32025825, 32025825, 32025825, 32025825, 32025825, 32025825]	2025-12-14 19:21:07.429348+07
41	2	2026	uoe_energy	[123413075, 99026680, 128474794, 121666238, 131368906, 131368906, 135411685, 144305797, 145922908, 163711133, 158860000, 163710986]	2025-12-14 19:21:07.429348+07
42	2	2026	mgt_fee	[75408747, 59459458, 79892172, 75147042, 91436388, 91729942, 94086223, 99270043, 112216533, 137078302, 133455820, 136856782]	2025-12-14 19:21:07.429348+07
43	2	2025	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 0]	2025-12-14 19:21:37.069716+07
44	2	2025	stat_room_available	[4061, 3668, 4061, 3930, 4061, 3930, 4061, 4061, 3930, 4061, 3930, 0]	2025-12-14 19:21:37.069716+07
45	2	2025	stat_occupied_rooms	[2943.49, 2769.21, 2401.27, 3098.41, 3388.89, 3280.44, 3470.22, 3416, 3330.79, 3408.25, 3485.71, 0]	2025-12-14 19:21:37.069716+07
46	2	2025	stat_guests	[4415.24, 4153.81, 3601.9, 4647.62, 5083.33, 4920.67, 5205.33, 5124, 4996.19, 5112.38, 5228.57, 0]	2025-12-14 19:21:37.069716+07
47	2	2025	rev_room	[1223800104.91, 1151338256.59, 938031352.31, 1288210636.74, 1408980383.94, 1363893011.65, 1607513964.56, 1420252227.01, 1542926349.91, 1578808358.05, 1614690366.19, 0]	2025-12-14 19:21:37.069716+07
48	2	2025	rev_fnb	[324278171.64, 295840865.8, 385497751.37, 365724739.17, 391412259.92, 385361646.11, 396528732.67, 393338136.51, 388324342.55, 392882337.06, 397440331.57, 0]	2025-12-14 19:21:37.069716+07
49	2	2025	rev_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:21:37.069716+07
50	2	2025	cos_fnb	[103451659.55, 94351721.68, 123041925.07, 116661668.6, 124828782.68, 122786801.14, 126360268.83, 125339278.06, 123734863.99, 125193422.24, 126651980.48, 0]	2025-12-14 19:21:37.069716+07
51	2	2025	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:21:37.069716+07
52	2	2025	osaw_room	[79350020.14, 79350020.14, 122075676.14, 81388700.52, 81388700.52, 82588700.52, 82588700.52, 82588700.52, 82588700.52, 82588700.52, 82588700.52, 0]	2025-12-14 19:21:37.069716+07
53	2	2025	osaw_fnb	[64013647.56, 64013647.56, 95982751.56, 66840739.01, 66840739.01, 66840739.01, 66840739.01, 66840739.01, 66840739.01, 66840739.01, 66840739.01, 0]	2025-12-14 19:21:37.069716+07
54	2	2025	ooe_room	[109936032.54, 104140421.61, 91030158, 115715854.47, 125898122.94, 122071052.82, 132026194.82, 126344641.85, 126965171.69, 129795071, 132542981.27, 0]	2025-12-14 19:21:37.069716+07
55	2	2025	ooe_fnb	[9711872.17, 9188625.74, 11588312.44, 10471513.8, 10941188.98, 10323907.28, 10529381.66, 10470674.69, 10378420.89, 10562287.97, 10646155.09, 0]	2025-12-14 19:21:37.069716+07
56	2	2025	usaw_ag	[61402171.56, 61402171.56, 61402171.56, 70539995.47, 70539995.47, 70539995.47, 70539995.47, 70539995.47, 70539995.47, 70539995.47, 70539995.47, 0]	2025-12-14 19:21:37.069716+07
57	2	2025	usaw_sm	[24971063.78, 24971063.78, 44055615.78, 26658748.71, 31126397.46, 31126397.46, 31126397.46, 31126397.46, 31126397.46, 31126397.46, 31126397.46, 0]	2025-12-14 19:21:37.069716+07
58	2	2025	usaw_pomec	[26917490.73, 26917490.73, 26917490.73, 28316889.55, 28316889.55, 28316889.55, 28316889.55, 28316889.55, 28316889.55, 28316889.55, 28316889.55, 0]	2025-12-14 19:21:37.069716+07
59	2	2025	uoe_ag	[38549749.34, 35036455.34, 36070244.14, 36269614.22, 50136052.67, 36822466.06, 38317222.98, 37212599.45, 37878043.06, 38129581.37, 38347147.09, 0]	2025-12-14 19:21:37.069716+07
60	2	2025	uoe_sm	[32248011.91, 32106366.23, 31932782.09, 32396617.72, 32602219.44, 32530430.19, 32888110.36, 32620746.86, 32785922.45, 32842693.51, 32899464.57, 0]	2025-12-14 19:21:37.069716+07
61	2	2025	uoe_pomec	[31010550.19, 60612840.48, 27875072.21, 32474617.7, 34506541.06, 33796477.57, 37338067.91, 34689721.79, 36327251.4, 36888816.13, 37450380.87, 0]	2025-12-14 19:21:37.069716+07
62	2	2025	uoe_energy	[97911375.54, 91991947.54, 85769241.23, 102928053.2, 112577558.18, 108975076.32, 115279419.58, 113478178.66, 110647657.19, 113220858.52, 115794260.85, 0]	2025-12-14 19:21:37.069716+07
63	2	2025	mgt_fee	[85918344.35, 80318441.29, 73455865.25, 91793413.36, 99921791.73, 97083633.51, 111224369.7, 100654265.18, 107184413.43, 109428833.58, 111673253.73, 0]	2025-12-14 19:21:37.069716+07
64	3	2025	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 0]	2025-12-14 19:24:19.150589+07
65	3	2025	stat_room_available	[3379, 3052, 3379, 3270, 3379, 3270, 3379, 3379, 3270, 3379, 3270, 0]	2025-12-14 19:24:19.150589+07
66	3	2025	stat_occupied_rooms	[1107.63, 1427.25, 922.11, 1434.6, 1730.33, 1609.1, 1980.15, 1528.28, 1930.55, 1530.12, 1522.77, 0]	2025-12-14 19:24:19.150589+07
67	3	2025	stat_guests	[2215.27, 2854.5, 1844.22, 2869.2, 3460.67, 3218.2, 3960.3, 3056.56, 3861.11, 3060.23, 3045.54, 0]	2025-12-14 19:24:19.150589+07
68	3	2025	rev_room	[376247067.93, 484815873.6, 289943954.53, 465577546.02, 561554479.32, 624597003.65, 768625079.83, 519133599.53, 626532651.56, 519757558.18, 591085520.58, 0]	2025-12-14 19:24:19.150589+07
69	3	2025	rev_fnb	[44083361.37, 48538237, 43117984.95, 47367730.67, 58539975, 59526883.11, 67503090.48, 52402452.69, 57697396.62, 45498255.86, 57371241.53, 0]	2025-12-14 19:24:19.150589+07
70	3	2025	rev_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:24:19.150589+07
71	3	2025	cos_fnb	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:24:19.150589+07
72	3	2025	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:24:19.150589+07
73	3	2025	osaw_room	[43767575, 46127605, 61843800, 46127605, 46127605, 46127605, 46127605, 45427605, 46127605, 45427605, 46127605, 0]	2025-12-14 19:24:19.150589+07
74	3	2025	osaw_fnb	[5170800.39, 5642806.19, 9946045.19, 5642806.19, 5642806.19, 5642806.19, 5642806.19, 5642806.19, 5642806.19, 5642806.19, 5642806.19, 0]	2025-12-14 19:24:19.150589+07
75	3	2025	ooe_room	[47358216.05, 59021167.99, 34014400.26, 58819839.15, 69563356.43, 75595036.34, 99967127.43, 62809776.25, 77025431.38, 62876922.8, 63819579.93, 0]	2025-12-14 19:24:19.150589+07
76	3	2025	ooe_fnb	[749417.14, 825150.03, 733005.74, 805251.42, 995179.57, 1011957.01, 1147552.54, 890841.7, 980855.74, 773470.35, 975311.11, 0]	2025-12-14 19:24:19.150589+07
77	3	2025	usaw_ag	[53300123.39, 54705523.39, 86192223.39, 56916323.39, 56916323.39, 56916323.39, 56916323.39, 56916323.39, 56916323.39, 56916323.39, 56916323.39, 0]	2025-12-14 19:24:19.150589+07
78	3	2025	usaw_sm	[5584800.39, 5946266.19, 7196266.19, 5946266.19, 5946266.19, 5946266.19, 6388426.19, 6388426.19, 6388426.19, 6388426.19, 6388426.19, 0]	2025-12-14 19:24:19.150589+07
79	3	2025	usaw_pomec	[16473060.78, 17817072.38, 26123550.38, 17417072.38, 17417072.38, 19017072.38, 19317072.38, 17417072.38, 17417072.38, 17417072.38, 19917072.38, 0]	2025-12-14 19:24:19.150589+07
80	3	2025	uoe_ag	[23768028.78, 25529558.37, 21788399.62, 24650916.58, 26380919.86, 22469977.98, 22713600.85, 25603985.43, 27391472.92, 25503501.61, 26834716.78, 0]	2025-12-14 19:24:19.150589+07
81	3	2025	uoe_sm	[6164488.92, 6164488.92, 3464488.92, 4664488.92, 6664488.92, 4664488.92, 6264488.92, 6764488.92, 6064488.92, 5564488.92, 6764488.92, 0]	2025-12-14 19:24:19.150589+07
82	3	2025	uoe_pomec	[14255149.59, 16094859.48, 9363338.95, 15762660.48, 17506750.82, 18548971.76, 22826193.03, 16716355.22, 16863048.54, 16197463.4, 16672605.35, 0]	2025-12-14 19:24:19.150589+07
83	3	2025	uoe_energy	[55547879.72, 71576621.14, 46243840.17, 71945097.96, 79305115.72, 80696422.28, 89086028.99, 76643177.33, 88604281.89, 76735296.52, 76366819.71, 0]	2025-12-14 19:24:19.150589+07
84	3	2025	mgt_fee	[21016521.46, 26667705.53, 16653096.97, 25647263.83, 31004722.72, 34206194.34, 41806408.52, 28576802.61, 34211502.41, 28262790.7, 32422838.11, 0]	2025-12-14 19:24:19.150589+07
85	4	2025	stat_days	[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 0]	2025-12-14 19:25:16.589402+07
86	4	2025	stat_room_available	[3069, 2871, 3069, 2970, 3069, 2970, 3069, 3069, 2970, 3069, 2970, 0]	2025-12-14 19:25:16.589402+07
87	4	2025	stat_occupied_rooms	[1926.36, 1748.66, 1524.6, 2114.36, 2019.07, 2068, 2114.36, 2356.44, 2369.31, 2472.33, 2503.23, 0]	2025-12-14 19:25:16.589402+07
88	4	2025	stat_guests	[2889.53, 2622.99, 2286.9, 3171.53, 3028.6, 3102, 3171.53, 3534.66, 3553.97, 3708.49, 3754.85, 0]	2025-12-14 19:25:16.589402+07
89	4	2025	rev_room	[711294164.16, 645680130.3, 494342295.73, 780711910.12, 745527573.13, 763595205.64, 780711910.12, 870099144.66, 874853784.79, 912890905.87, 924302042.2, 0]	2025-12-14 19:25:16.589402+07
90	4	2025	rev_fnb	[74922756.97, 70131085.54, 101952013.61, 76439395.06, 66457542.07, 66950900.87, 81089395.06, 87509121.16, 87638952.43, 86427602.53, 89842377.59, 0]	2025-12-14 19:25:16.589402+07
91	4	2025	rev_others	[24594215, 24594215, 24594215, 24594215, 24594215, 24594215, 24594215, 24594215, 24594215, 24594215, 24594215, 0]	2025-12-14 19:25:16.589402+07
92	4	2025	cos_fnb	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:25:16.589402+07
93	4	2025	cos_others	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]	2025-12-14 19:25:16.589402+07
94	4	2025	osaw_room	[62992317, 60812317, 91530525.2, 66143289, 67233289, 66143289, 67233289, 67233289, 66143289, 67233289, 66143289, 0]	2025-12-14 19:25:16.589402+07
95	4	2025	osaw_fnb	[6378754.65, 6108754.65, 11221030.65, 6796454.65, 6936454.65, 6796454.65, 6936454.65, 6936454.65, 6796454.65, 6936454.65, 6796454.65, 0]	2025-12-14 19:25:16.589402+07
96	4	2025	ooe_room	[54160465.54, 49455581.83, 42066990.61, 58578501.61, 56095230.23, 57361119.26, 58625237.99, 65482679.17, 65301715.25, 68026135.05, 68818597.61, 0]	2025-12-14 19:25:16.589402+07
97	4	2025	ooe_fnb	[1548609.62, 1462359.55, 1835136.25, 1375909.12, 1196235.76, 1205116.22, 1659609.12, 1775164.18, 1577501.15, 1555696.85, 1617162.79, 0]	2025-12-14 19:25:16.589402+07
98	4	2025	usaw_ag	[55726786.65, 55546786.65, 90089062.65, 56157715.25, 56247715.25, 56157715.25, 56247715.25, 56247715.25, 56157715.25, 56247715.25, 56157715.25, 0]	2025-12-14 19:25:16.589402+07
99	4	2025	usaw_sm	[17903534.65, 17793534.65, 32645810.65, 18374463.25, 18424463.25, 18374463.25, 18424463.25, 18424463.25, 18374463.25, 18424463.25, 18374463.25, 0]	2025-12-14 19:25:16.589402+07
100	4	2025	usaw_pomec	[19112889.31, 18332889.31, 27797441.31, 19801517.91, 20191517.91, 19801517.91, 20191517.91, 20191517.91, 19801517.91, 20191517.91, 19801517.91, 0]	2025-12-14 19:25:16.589402+07
101	4	2025	uoe_ag	[29456997.93, 26713768.91, 27084259.7, 27495001.36, 27259774.59, 27350003.03, 27531272.82, 29053420.76, 28069112.17, 28280741.59, 28350613.84, 0]	2025-12-14 19:25:16.589402+07
102	4	2025	uoe_sm	[14136544.82, 13246868.71, 11757804.09, 15035351.55, 14469724.14, 14704838.29, 15090904.28, 16301635.86, 16363508.02, 16831604.84, 17017171.14, 0]	2025-12-14 19:25:16.589402+07
103	4	2025	uoe_pomec	[23844712.68, 19029641.73, 16797248.62, 25169658.55, 20826023.17, 21172714.12, 25256513.43, 23546041.04, 23637275.48, 37825124.59, 24602049.98, 0]	2025-12-14 19:25:16.589402+07
104	4	2025	uoe_energy	[60673432.44, 55175562.57, 47549804.75, 66409860.13, 63294487.46, 64789755.39, 66514773.96, 74002187.65, 74395679.21, 77492846.93, 78507240.99, 0]	2025-12-14 19:25:16.589402+07
105	4	2025	mgt_fee	[63000025.28, 57529501.98, 48243038.34, 68511626.92, 65002213.96, 66444402.98, 68872931.92, 76317132.76, 76696656.19, 79558018.61, 80709991.92, 0]	2025-12-14 19:25:16.589402+07
\.


--
-- TOC entry 5357 (class 0 OID 34622)
-- Dependencies: 233
-- Data for Name: dsr_opening_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dsr_opening_balances (id, hotel_id, effective_date, balance_value, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5386 (class 0 OID 35245)
-- Dependencies: 262
-- Data for Name: guest_review_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_review_settings (id, hotel_id, logo_url, header_text, subheader_text, promo_enabled, promo_title, promo_description, promo_image_url, created_at, updated_at) FROM stdin;
3	2	/uploads/reviews/logo-1766034055660-604380609.jpg	Bagaimana Pengalaman Menginap Anda?	Kami sangat menghargai masukan Anda untuk menjadi lebih baik.	t	Discount Hari Senin	Silahkan tunjukan promo ini ketika anda kembali di hotel kami 	/uploads/reviews/promo_image-1766036102882-665674260.jpg	2025-12-18 12:00:55.669361+07	2025-12-18 12:35:02.927497+07
\.


--
-- TOC entry 5382 (class 0 OID 35200)
-- Dependencies: 258
-- Data for Name: guest_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_reviews (id, hotel_id, guest_name, room_number, checkin_date, rating, cleanliness_rating, service_rating, facilities_rating, comment, status, created_at, updated_at, guest_email, reply_text, replied_at) FROM stdin;
11	2	Asep Suhendar	109	2025-12-03	3	2	3	4	ada rambut	approved	2025-12-19 12:51:38.454889+07	2025-12-19 13:01:50.132311+07	asep3580@gmail.com	\N	\N
\.


--
-- TOC entry 5346 (class 0 OID 34461)
-- Dependencies: 222
-- Data for Name: hotels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hotels (id, name, created_at, updated_at, address, brand, city, thumbnail_url) FROM stdin;
2	Feruci Braga Hotel	2025-12-14 18:30:03.507909+07	2025-12-14 18:30:03.507909+07	Jl. Braga No.67, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111	Unique	Bandung	\N
1	Golden Flower Hotel	2025-12-14 16:03:34.967876+07	2025-12-14 18:34:14.050842+07	Jl. Asia Afrika No.15-17, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111	Unique	Bandung	\N
4	Grand Serela Setiabudhi Hotel	2025-12-14 18:32:05.204941+07	2025-12-14 18:34:34.436635+07	Jl. Hegarmanah No.15 No. 9, Hegarmanah, Cidadap, Bandung City, West Java 12630	Unique	Bandung	\N
5	Grand Serela Yogyakarta Hotel	2025-12-14 18:36:06.298849+07	2025-12-14 18:36:06.298849+07	Jl. Magelang KM 4 No.145 Sleman Yogyakarta 55284 Indonesia,	Unique	Yogyakarta	\N
6	Gino Villa Ubud	2025-12-14 18:40:35.401969+07	2025-12-14 18:40:35.401969+07	F756+QFP, Jalan A A Gede Rai, Banjar Tengah, Lodtunduh, Gianyar Regency, Bali 80571	Unique	Bali	\N
7	Gino Feruci Cianjur Hotel	2025-12-14 18:41:28.349778+07	2025-12-14 18:41:28.349778+07	Jl. KH Abdullah Bin Nuh No.46, Pamoyanan, Kec. Cianjur, Kabupaten Cianjur, Jawa Barat 43211	Unique	Cianjur	\N
9	Serela Riau Hotel	2025-12-14 18:43:21.358846+07	2025-12-14 18:43:21.358846+07	LLRE Martadinata St No.56, Citarum, Bandung Wetan, Bandung City, West Java 40115	Serela	Bandung	\N
8	Serela Cihampelas Hotel	2025-12-14 18:42:21.739315+07	2025-12-14 18:43:30.336335+07	Jl. Cihampelas No.147, Cipaganti, Kecamatan Coblong, Kota Bandung, Jawa Barat 40131	Serela	Bandung	\N
10	Serela Merdeka Hotel	2025-12-14 18:44:18.126623+07	2025-12-14 18:44:18.126623+07	Jl. Purnawarman No.23, Tamansari, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40116	Serela	Bandung	\N
11	Serela Waringin Hotel	2025-12-14 18:44:58.311091+07	2025-12-14 18:44:58.311091+07	Jl. Kelenteng No.30-33, Ciroyom, Kec. Andir, Kota Bandung, Jawa Barat 40181	Serela	Bandung	\N
12	Serela Kuta Hotel	2025-12-14 18:45:33.721977+07	2025-12-14 18:45:33.721977+07	No Jl. Raya Kuta, Kuta, Kec. Kuta, Kabupaten Badung, Bali 80361	Serela	Bali	\N
13	Zodiak Asia Afrika Hotel	2025-12-14 18:47:09.077322+07	2025-12-14 18:47:09.077322+07	Jl. Asia Afrika No.34, Balonggede, Kec. Regol, Kota Bandung, Jawa Barat 40251	Zodiak	Bandung	\N
14	Zodiak Kebon Kawung Hotel	2025-12-14 18:47:44.21034+07	2025-12-14 18:47:44.21034+07	Jl. Kebon Kawung No.54, Bandung, Jawa Barat, Kota Bandung, Jawa Barat 40171	Zodiak	Bandung	\N
15	Zodiak Kebonjati Hotel	2025-12-14 18:48:23.034375+07	2025-12-14 18:48:23.034375+07	Jl. Kebon Jati No.34, Kb. Jeruk, Kec. Andir, Kota Bandung, Jawa Barat 40181	Zodiak	Bandung	\N
3	Opera White Hotel	2025-12-14 18:31:10.063492+07	2025-12-14 18:48:47.744215+07	Jl. Kebon Jati No.71-75, Kb. Jeruk, Kec. Andir, Kota Bandung, Jawa Barat 40171	Unique	Bandung	\N
16	Zodiak Sutami Hotel	2025-12-14 18:49:24.577949+07	2025-12-14 18:49:24.577949+07	Jl. Prof. Dr. Sutami No.97, Sukarasa, Kec. Sukasari, Kota Bandung, Jawa Barat 40163	Zodiak	Bandung	\N
17	Zodiak Paskal Hotel	2025-12-14 18:50:03.191664+07	2025-12-14 18:50:03.191664+07	Jl. Pasir Kaliki No.50, Pasir Kaliki, Kec. Cicendo, Kota Bandung, Jawa Barat 40171	Zodiak	Bandung	\N
18	Zodiak MT Haryono Hotel	2025-12-14 18:51:03.224243+07	2025-12-14 18:51:03.224243+07	Jl. Otista Raya No.60 11, RT.11/RW.12, Bidara Cina, Kecamatan Jatinegara, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13330	Zodiak	Jakarta	\N
19	Parlezo Hotel	2025-12-14 18:52:12.137134+07	2025-12-14 18:52:12.137134+07	GV6M+282, Labuan Bajo, Komodo, West Manggarai Regency, East Nusa Tenggara	Serela	Labuan Bajo NTT	\N
20	The Naripan Hotel	2025-12-14 18:52:53.100867+07	2025-12-14 18:52:53.100867+07	Jl. Naripan No.31-35, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111	Serela	Bandung	\N
\.


--
-- TOC entry 5372 (class 0 OID 34753)
-- Dependencies: 248
-- Data for Name: inspection_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_items (id, inspection_type_id, category, name, standard, "position", created_at, updated_at) FROM stdin;
487	1	Kebersihan	Lantai bersih dan tidak berdebu	Lantai harus disapu dan dipel, bebas dari kotoran dan debu.	1	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
488	1	Kebersihan	Jendela dan cermin bersih	Tidak ada noda, sidik jari, atau debu pada permukaan kaca.	2	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
489	1	Kebersihan	Tempat tidur rapi dan sprei bersih	Sprei dan bed cover terpasang kencang, rapi, dan tidak ada noda.	3	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
490	1	Kebersihan	Tidak ada sarang laba-laba	Periksa seluruh sudut ruangan, langit-langit, dan di balik perabotan.	4	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
491	1	Fasilitas Kamar	AC berfungsi dengan baik	AC menyala, suhu bisa diatur, dan tidak mengeluarkan suara bising.	1	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
492	1	Fasilitas Kamar	TV berfungsi dan remote tersedia	TV menyala, semua channel berfungsi, remote ada dan berfungsi.	2	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
493	1	Fasilitas Kamar	Semua lampu berfungsi	Periksa semua lampu di kamar dan kamar mandi.	3	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
494	1	Kamar Mandi	Toilet bersih dan higienis	Toilet bowl, seat, dan area sekitar bersih dan sudah disanitasi.	1	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
495	1	Kamar Mandi	Shower berfungsi (air panas & dingin)	Aliran air lancar untuk panas dan dingin.	2	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
496	1	Kamar Mandi	Handuk bersih dan lengkap	Tersedia handuk sesuai standar jumlah dan dalam kondisi bersih.	3	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
497	2	Lobi	Kebersihan lantai lobi	Lantai lobi bersih, kering, dan tidak licin.	1	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
498	2	Lobi	Kerapian sofa dan meja	Sofa dan meja tertata rapi, bebas dari debu dan sampah.	2	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
499	2	Koridor	Penerangan koridor cukup	Semua lampu koridor menyala dan tidak ada yang redup atau mati.	1	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
500	2	Koridor	Tidak ada barang penghalang	Koridor bebas dari troli, sampah, atau barang lain yang menghalangi jalan.	2	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
501	3	Kebersihan Peralatan	Kompor dan oven bersih	Bebas dari sisa makanan, minyak, dan kerak.	1	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
502	3	Kebersihan Peralatan	Kulkas dan Freezer bersih	Bersih dari tumpahan, tidak berbau, dan suhu sesuai standar.	2	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
503	3	Penyimpanan Makanan	Penerapan sistem FIFO	Bahan makanan lama berada di depan untuk digunakan lebih dulu.	1	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
504	3	Keamanan	Tabung pemadam api (APAR) tersedia	APAR berada di lokasi yang mudah dijangkau dan belum kedaluwarsa.	1	2025-12-19 14:07:04.203798+07	2025-12-19 14:07:04.203798+07
\.


--
-- TOC entry 5376 (class 0 OID 34801)
-- Dependencies: 252
-- Data for Name: inspection_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_results (id, inspection_id, item_id, result, notes, image_url, priority) FROM stdin;
12	12	491	fail	tidak dingin	uploads/inspection-photo-1766128547581-144029199.png	medium
14	12	492	pass	\N	\N	medium
15	12	493	pass	\N	\N	medium
16	12	494	pass	\N	\N	medium
17	12	495	pass	\N	\N	medium
18	12	496	pass	\N	\N	medium
19	12	487	pass	\N	\N	medium
20	12	488	pass	\N	\N	medium
21	12	489	pass	\N	\N	medium
22	12	490	pass	\N	\N	medium
\.


--
-- TOC entry 5378 (class 0 OID 34840)
-- Dependencies: 254
-- Data for Name: inspection_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_tasks (id, inspection_id, item_id, hotel_id, description, notes, status, priority, assigned_to, due_date, completion_photo_url, completed_at, created_at, updated_at) FROM stdin;
2	12	491	2	tidak dingin	AC berfungsi dengan baik	pending	medium	Asep Suhendar	\N	\N	\N	2025-12-19 14:16:23.635523+07	2025-12-19 14:16:23.635523+07
\.


--
-- TOC entry 5370 (class 0 OID 34741)
-- Dependencies: 246
-- Data for Name: inspection_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_types (id, name, created_at, updated_at) FROM stdin;
1	Inspeksi Kamar	2025-12-14 15:57:50.209381+07	2025-12-19 14:07:04.203798+07
2	Inspeksi Area Publik	2025-12-14 15:57:50.209381+07	2025-12-19 14:07:04.203798+07
3	Inspeksi Dapur	2025-12-14 15:57:50.209381+07	2025-12-19 14:07:04.203798+07
\.


--
-- TOC entry 5374 (class 0 OID 34778)
-- Dependencies: 250
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspections (id, hotel_id, inspection_type_id, room_number_or_area, inspection_date, status, score, created_at, updated_at, pic_name, inspector_id, notes, inspector_name) FROM stdin;
12	2	1	109	2025-12-19 14:15:32.620944+07	completed	90.00	2025-12-19 14:15:32.620944+07	2025-12-19 14:16:23.635523+07	Asep Suhendar	\N	\N	Asep Suhendar
\.


--
-- TOC entry 5363 (class 0 OID 34676)
-- Dependencies: 239
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, action, group_name, description) FROM stdin;
1	menu:dashboard	Menu Access	Akses menu Dashboard
2	menu:achievement	Menu Access	Akses menu Achievement
3	submenu:slides_corporate	Menu Access	Akses submenu Slides Corporate
4	submenu:slides_hotel	Menu Access	Akses submenu Slides Hotel
5	submenu:ebook	Menu Access	Akses submenu Budget Ebook
6	submenu:input_budget_pl	Menu Access	Akses submenu Input Budget P&L
7	submenu:input_actual_pl	Menu Access	Akses submenu Input Actual P&L
8	menu:daily_income	Menu Access	Akses menu Daily Income
9	submenu:daily_income_dashboard	Menu Access	Akses submenu Dashboard Daily Income
10	submenu:input_budget_dsr	Menu Access	Akses submenu Input Budget DSR
11	submenu:input_actual_dsr	Menu Access	Akses submenu Input Actual DSR
12	submenu:input_room_production	Menu Access	Akses submenu Input Room Production
13	menu:ar_aging	Menu Access	Akses menu AR Aging
14	submenu:input_ar_aging	Menu Access	Akses submenu Input AR Aging
15	menu:inspection	Menu Access	Akses menu Inspection
16	submenu:inspection_dashboard	Menu Access	Akses submenu Dashboard Inspection
17	submenu:hotel_inspection	Menu Access	Akses submenu Hotel Inspection
18	submenu:task_to_do	Menu Access	Akses submenu Task to Do
19	menu:reports	Menu Access	Akses menu Reports
20	menu:settings	Menu Access	Akses menu Settings
21	users:manage	User Management	Bisa menambah, mengedit, dan menghapus pengguna
22	hotels:manage	Hotel Management	Bisa menambah, mengedit, dan menghapus hotel
23	roles:manage	Role Management	Bisa mengelola role dan hak aksesnya
24	inspection_types:manage	Inspection Settings	Bisa mengelola tipe dan item inspeksi
49	submenu:ar_summary	Menu Access	Akses submenu AR Aging Summary
50	menu:trial_balance	Menu Access	Akses menu Trial Balance
51	menu:guest_review	Menu Access	Akses menu Guest Review
52	submenu:guest_review_dashboard	Menu Access	Akses submenu Dashboard Guest Review
53	submenu:guest_review_settings	Menu Access	Akses submenu Pengaturan Guest Review
54	submenu:guest_review_replies	Menu Access	Akses submenu Balasan Guest Review
55	menu:audit	Menu Access	Akses menu Audit
56	submenu:agenda_audit	Menu Access	Akses submenu Agenda Audit
57	submenu:audit_calendar	Menu Access	Akses submenu Kalender Audit
58	settings:audit_checklists	Settings	Bisa mengelola checklist untuk audit
59	audit_agendas:manage	Audit	Bisa membuat, mengedit, dan menghapus agenda audit
60	audit_results:submit	Audit	Bisa mengisi dan mengirimkan hasil audit
97	financials:pl:manage	Financials	Bisa input budget dan actual P&L
98	financials:dsr:manage	Financials	Bisa input budget, actual, dan opening balance DSR
99	financials:room_prod:manage	Financials	Bisa input data room production
100	financials:ar_aging:manage	Financials	Bisa input data AR Aging
\.


--
-- TOC entry 5384 (class 0 OID 35221)
-- Dependencies: 260
-- Data for Name: review_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review_media (id, review_id, file_path, media_type, created_at) FROM stdin;
\.


--
-- TOC entry 5364 (class 0 OID 34686)
-- Dependencies: 240
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
4	16
4	18
5	1
5	2
5	3
5	4
5	5
5	8
5	9
5	13
5	15
5	16
5	17
5	18
5	19
2	49
2	50
2	51
2	52
2	53
2	54
2	55
2	56
2	57
2	58
5	49
5	50
5	51
5	52
5	55
5	56
5	57
6	55
6	56
6	57
6	59
6	60
6	58
2	97
2	98
2	99
2	100
2	1
2	2
2	3
2	4
2	5
2	6
2	7
2	8
2	9
2	10
2	11
2	12
2	13
2	14
2	15
2	16
2	17
2	18
2	19
2	20
2	21
2	22
2	24
2	59
2	60
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
1	10
1	11
1	12
1	13
1	14
1	15
1	16
1	17
1	18
1	19
1	20
1	21
1	22
1	23
1	24
1	49
1	50
1	51
1	52
1	53
1	54
1	55
1	56
1	57
1	58
1	59
1	60
1	97
1	98
1	99
1	100
\.


--
-- TOC entry 5361 (class 0 OID 34662)
-- Dependencies: 237
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at, updated_at) FROM stdin;
1	admin	Akses penuh ke semua fitur.	2025-12-14 15:57:50.209381+07	2025-12-14 15:57:50.209381+07
2	manager	Akses ke fitur manajerial dan laporan.	2025-12-14 15:57:50.209381+07	2025-12-14 15:57:50.209381+07
3	staff	Akses terbatas sesuai tugas operasional.	2025-12-14 15:57:50.209381+07	2025-12-14 15:57:50.209381+07
4	engineering	Akses ke dashboard inspeksi dan daftar tugas.	2025-12-14 15:57:50.209381+07	2025-12-14 15:57:50.209381+07
5	direksi	Akses lihat-saja ke semua laporan dan dashboard.	2025-12-14 15:57:50.209381+07	2025-12-14 15:57:50.209381+07
6	auditor	Akses untuk melakukan dan mengelola agenda audit.	2025-12-19 13:59:16.65619+07	2025-12-19 13:59:16.65619+07
\.


--
-- TOC entry 5359 (class 0 OID 34639)
-- Dependencies: 235
-- Data for Name: room_production; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.room_production (id, hotel_id, date, segment, company, room, guest, arr, lodging_revenue, pic_name, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5368 (class 0 OID 34723)
-- Dependencies: 244
-- Data for Name: slides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.slides (id, hotel_id, title, link, thumbnail_url, "position", created_at, updated_at) FROM stdin;
8	\N	Summary Jan-Nov 2025	https://docs.google.com/presentation/d/1r_wpDO2ls3dQpFd0QZ52g7IdqEDdxkyywTgtqDzLJ9g/edit?slide=id.p1#slide=id.p1	https://img.freepik.com/psd-premium/garis-grafik-3d-di-latar-belakang-transparan_1195761-15731.jpg?w=360	1	2025-12-14 18:17:09.938271+07	2025-12-14 18:20:44.885874+07
9	\N	Hotel Report Nov 2025	https://docs.google.com/presentation/d/1kenRIbJX5B4oPKoWgKHsAARkCLd_CkXHD_s0-nsJTHE/edit?slide=id.p1#slide=id.p1	https://crisissupportsolutions.com/wp-content/uploads/2013/08/stats-pie-chart-bar-graph.jpg	3	2025-12-14 18:18:54.849992+07	2025-12-14 18:20:44.885874+07
10	\N	PT PNH Report Nov 2025	https://docs.google.com/presentation/d/15JZxXoOD0L1KPNW-340uqCVyV9hOieKchXMK3dMmWBI/edit?slide=id.p1#slide=id.p1	https://img.freepik.com/psd-gratis/templat-infografis-bisnis-5-langkah_47987-13875.jpg?semt=ais_se_enriched&w=740&q=80	2	2025-12-14 18:20:03.106132+07	2025-12-14 18:20:44.885874+07
21	17	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1fyJ9EobzlMnOeyKoOuDHDF20YYY5uH8D5hJjnxdGkh4/edit?slide=id.p#slide=id.p	https://q-xx.bstatic.com/xdata/images/hotel/max500/30758863.jpg?k=1fc789e125ae21ac888d47323a20e84e188f84121acb03de369e386eaff03d59&o=	10	2025-12-14 19:08:21.66419+07	2025-12-18 05:53:23.394083+07
22	16	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1F5IAjc61BlvM64NLEHQEQqDyqZ1SJHQy4AwYwhkgRUQ/edit?slide=id.p#slide=id.p	https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2025/05/19/ff227716-a1f2-4a9e-b392-c0020f09d1e8-1747623428360-193950e2da247d17a3b93c61becb4566.jpg	12	2025-12-14 19:09:35.340379+07	2025-12-18 05:53:23.394083+07
23	15	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1nX157L19lpTDJNPD0wxcYoYlJfxPDjIF1GJI1NNDO1Y/edit?slide=id.p#slide=id.p	https://pix10.agoda.net/hotelImages/551/551929/551929_16083011170045910927.jpg?ca=6&ce=1&s=414x232	13	2025-12-14 19:11:19.281181+07	2025-12-18 05:53:23.394083+07
24	18	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1IUjbB6p-cs-SEkDm621qz_AV4g_M_zTyIlNsZrUTN8s/edit?slide=id.p#slide=id.p	https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-dskt/tix-hotel/images-web/2020/10/31/e4fee307-e26f-47e5-baf6-4093b323bcb7-1604139122507-73c28690eddf1f80e572dea1adc5421f.jpg	16	2025-12-14 19:12:13.146918+07	2025-12-18 05:53:23.394083+07
25	20	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1udWYWSpQgJHZBA_nVrkNA6F036atBT9uiR-rXdB2qKM/edit?slide=id.p#slide=id.p	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3dBq6DUH-Y2Bpl42WheQn2mjnBRazIDg-GQ&s	17	2025-12-14 19:13:44.26518+07	2025-12-18 05:53:23.394083+07
26	19	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1zrEabG9YVAIKU6RKBtoxkXbI-t3RBLqWLoWhqXowWVk/edit?slide=id.p#slide=id.p	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/27/50/18/fb/facade.jpg?w=900&h=500&s=1	14	2025-12-14 19:14:43.069122+07	2025-12-18 05:53:23.394083+07
7	1	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1xfl6-6LrAdPbmoCG0oJTBg_OK0fhx0sRnHVEA9QEJRs/edit?slide=id.p#slide=id.p	https://cf.bstatic.com/xdata/images/hotel/max1024x768/14322960.jpg?k=4cbec7d7e4cccef3bc4aa39bdc5b86dbf3e684d7520fbcad945b40a8478c93fa&o=	1	2025-12-14 17:58:54.759786+07	2025-12-18 05:53:23.394083+07
11	2	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1RcMjri2_UxLJC8TS757AHOGjwCekcOrgDpbtNBcNWdo/edit?slide=id.p#slide=id.p	https://newsletter.kagumhotels.com/wp-content/uploads/2025/03/image-23-960x1000.png	2	2025-12-14 18:54:32.481137+07	2025-12-18 05:53:23.394083+07
12	3	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1skQwiO3azAHlGWTp6sFw0QFCJn89yl7TK_IRnipnrVU/edit?slide=id.p#slide=id.p	https://q-xx.bstatic.com/xdata/images/hotel/max500/181769144.jpg?k=935e5cd34b348bf5946f8f6e033d7876bb18284921a98505a0482e10dfcfbadb&o=	0	2025-12-14 18:55:47.637455+07	2025-12-18 05:53:23.394083+07
13	4	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1MdcMvQJ0sBUSyyh9_Xk-rGGfEhC1U-Fmg3ca6J7qDhs/edit?slide=id.p#slide=id.p	https://q-xx.bstatic.com/xdata/images/hotel/max500/20917113.jpg?k=c6923887c5ed9918cdec91e7bbbce2158ed6f39e751c50f6502bf26ae9f407ff&o=	4	2025-12-14 18:56:58.989201+07	2025-12-18 05:53:23.394083+07
14	6	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1Zm1B04pzxwopf9qpsbadVLfb_wijx5Hng-5bTnlff-w/edit?slide=id.p#slide=id.p	https://ik.imagekit.io/tvlk/apr-asset/dgXfoyh24ryQLRcGq00cIdKHRmotrWLNlvG-TxlcLxGkiDwaUSggleJNPRgIHCX6/hotel/asset/10000122-1500x1001-FIT_AND_TRIM-d52e589b9fb8944e5fd8db97c963ba01.jpeg?tr=q-80,c-at_max,w-740,h-500&_src=imagekit	5	2025-12-14 18:59:02.511677+07	2025-12-18 05:53:23.394083+07
15	8	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/18OialgNZADHp2pmlJW5oq-fT6hq3lUFdz9EbxePsfxM/edit?slide=id.p#slide=id.p	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/06/cf/0e/64/serela-cihampelas.jpg?w=900&h=500&s=1	11	2025-12-14 19:00:08.388966+07	2025-12-18 05:53:23.394083+07
16	9	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1toJ00YZM2vgxuyBImn54DPzoLDiWn9gd08KiFtOINb0/edit?slide=id.p#slide=id.p	https://pbs.twimg.com/profile_images/459514844492754944/TTOq9Fhk_400x400.jpeg	15	2025-12-14 19:02:40.04383+07	2025-12-18 05:53:23.394083+07
17	11	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1lfinvs5W3E83pJsIS8qeOhCmNGwStEmah8CHuK_znqg/edit?slide=id.p#slide=id.p	https://pix10.agoda.net/hotelImages/648/648807/648807_16092018170046686550.jpg?ca=6&ce=1&s=414x232	6	2025-12-14 19:03:37.136848+07	2025-12-18 05:53:23.394083+07
18	10	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1B48nwEMiCx91cqiK-fayRkACUhV3wGGVcbQeFZEz4n8/edit?slide=id.p#slide=id.p	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/04/c0/b0/b6/hotel-serela-merdeka.jpg?w=900&h=500&s=1	3	2025-12-14 19:05:03.492296+07	2025-12-18 05:53:23.394083+07
19	12	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1_8BoF7fv85oX6Ck74dGGF-WIg5kEX-LYs1fgzCw98hc/edit?slide=id.p#slide=id.p	https://pix10.agoda.net/hotelImages/281/281587/281587_15070213590031558561.jpg?ca=4&ce=1&s=414x232	7	2025-12-14 19:06:03.565672+07	2025-12-18 05:53:23.394083+07
20	13	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/1dql5QK1hZB-BCz5z_HTEoddesocVYtfgyuZR2vC-eO8/edit?slide=id.p#slide=id.p	https://www.bandunghotels.net/data/Pics/OriginalPhoto/15845/1584551/1584551973/pic-zodiak-asia-afrika-by-kagum-hotels-bandung-1.JPEG	9	2025-12-14 19:07:10.771981+07	2025-12-18 05:53:23.394083+07
27	14	Profit (loss) Nov 2025	https://docs.google.com/presentation/d/19QTPBukuUceUkUki_RY2VS5EERyXKxghpVQvWxfhXZM/edit?slide=id.p#slide=id.p	https://pix10.agoda.net/hotelImages/621268/0/361b60999705ec9bb4c27fd9f095dd8a.jpeg?ce=0&s=414x232	8	2025-12-14 19:16:28.84993+07	2025-12-18 05:53:23.394083+07
\.


--
-- TOC entry 5380 (class 0 OID 35124)
-- Dependencies: 256
-- Data for Name: trial_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trial_balances (id, title, link, status, created_at, updated_at, thumbnail_url, "position", drive_folder_link) FROM stdin;
6	Trial Balance - Serela Riau Hotel	https://docs.google.com/spreadsheets/d/1ReBj1nUMcMRtulkKIef4w1qReFh5NtcLg2699CTeFsA/edit?gid=1048484551#gid=1048484551	in_audit	2025-12-18 05:32:39.536027+07	2025-12-18 06:34:04.004909+07	https://cf.bstatic.com/xdata/images/hotel/max500/81922714.jpg?k=2c8559234f736c6b4834686cdd8eb05a32edd92becc7c952f063205aab05381e&o=&hp=1	5	\N
4	Trial Balance - Vismaya Ubud	https://docs.google.com/spreadsheets/d/1_R1R29_NbEUWv2lhjFfyqDsM_6gfj07rHM-wG6BvOZs/edit?gid=732429151#gid=732429151	not_audited	2025-12-18 05:28:23.611793+07	2025-12-18 06:34:04.004909+07	https://ik.imagekit.io/tvlk/apr-asset/dgXfoyh24ryQLRcGq00cIdKHRmotrWLNlvG-TxlcLxGkiDwaUSggleJNPRgIHCX6/hotel/asset/10000122-1500x1001-FIT_AND_TRIM-d52e589b9fb8944e5fd8db97c963ba01.jpeg?tr=q-80,c-at_max,w-740,h-500&_src=imagekit	1	\N
3	Trial Balance - White Opera Hotel	https://docs.google.com/spreadsheets/d/1qfuegFl8Vzex0RbDFcZwPs2mUxDAjfWuYlCxYzi85fg/edit?gid=0#gid=0	not_audited	2025-12-18 05:25:21.726488+07	2025-12-18 06:34:04.004909+07	https://q-xx.bstatic.com/xdata/images/hotel/max500/181769144.jpg?k=935e5cd34b348bf5946f8f6e033d7876bb18284921a98505a0482e10dfcfbadb&o=	2	\N
2	Trial Balance - Feruci Braga Hotel	https://docs.google.com/spreadsheets/d/1apIBoRuFOvAnvsplpaUiOqXtXVVW7SKXsZsqxhbJA2g/edit?gid=927072881#gid=927072881	closed	2025-12-18 05:13:46.265629+07	2025-12-18 06:34:04.004909+07	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQveFRm4ltoCfzFmid-sfEdVYNesr7io26-Vw&s	3	\N
1	Trial Balance - Golden Flower Hotel	https://docs.google.com/spreadsheets/d/1QKwiaJG5bk2vI9kp8OYbIGCs0f1QoUS8x2_CTKbBulY/edit?gid=239012900#gid=239012900	in_audit	2025-12-18 04:55:09.622465+07	2025-12-18 06:34:04.004909+07	https://cf.bstatic.com/xdata/images/hotel/max1024x768/14322960.jpg?k=4cbec7d7e4cccef3bc4aa39bdc5b86dbf3e684d7520fbcad945b40a8478c93fa&o=	4	\N
5	Trial Balance - Grand Serela Setiabudhi Hotel	https://docs.google.com/spreadsheets/d/1e38pAZlIhxm7TUpKz6ITTB2L1eK29O4cBqxeWdZTOPI/edit?gid=2037499852#gid=2037499852	closed	2025-12-18 05:30:28.643383+07	2025-12-18 15:00:14.410213+07	https://q-xx.bstatic.com/xdata/images/hotel/max500/20917113.jpg?k=c6923887c5ed9918cdec91e7bbbce2158ed6f39e751c50f6502bf26ae9f407ff&o=	0	https://drive.google.com/drive/folders/1BtQCqgIVWqBIEJTrhAMjdUEEdHA78eY9?usp=sharing
\.


--
-- TOC entry 5347 (class 0 OID 34474)
-- Dependencies: 223
-- Data for Name: user_hotel_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_hotel_access (user_id, hotel_id) FROM stdin;
\.


--
-- TOC entry 5344 (class 0 OID 34446)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, full_name, role, hotel_id, created_at) FROM stdin;
1	admin	asep3580@gmail.com	$2b$10$00FzwbsZiHSjJaGpnreeSe6hsOTpzDRiYaf6EOoiGsPBb2wcQx1lu	Asep Suhendar	admin	\N	2025-12-14 15:59:13.293154+07
\.


--
-- TOC entry 5426 (class 0 OID 0)
-- Dependencies: 228
-- Name: actual_dsr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actual_dsr_id_seq', 31, true);


--
-- TOC entry 5427 (class 0 OID 0)
-- Dependencies: 230
-- Name: actuals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actuals_id_seq', 84, true);


--
-- TOC entry 5428 (class 0 OID 0)
-- Dependencies: 241
-- Name: ar_aging_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ar_aging_id_seq', 60, true);


--
-- TOC entry 5429 (class 0 OID 0)
-- Dependencies: 263
-- Name: audit_agendas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_agendas_id_seq', 1, true);


--
-- TOC entry 5430 (class 0 OID 0)
-- Dependencies: 265
-- Name: audit_checklist_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_checklist_categories_id_seq', 1, true);


--
-- TOC entry 5431 (class 0 OID 0)
-- Dependencies: 267
-- Name: audit_checklist_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_checklist_items_id_seq', 2, true);


--
-- TOC entry 5432 (class 0 OID 0)
-- Dependencies: 269
-- Name: audit_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_results_id_seq', 1, false);


--
-- TOC entry 5433 (class 0 OID 0)
-- Dependencies: 217
-- Name: books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.books_id_seq', 5, true);


--
-- TOC entry 5434 (class 0 OID 0)
-- Dependencies: 226
-- Name: budget_dsr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_dsr_id_seq', 1, false);


--
-- TOC entry 5435 (class 0 OID 0)
-- Dependencies: 224
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budgets_id_seq', 105, true);


--
-- TOC entry 5436 (class 0 OID 0)
-- Dependencies: 232
-- Name: dsr_opening_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dsr_opening_balances_id_seq', 1, false);


--
-- TOC entry 5437 (class 0 OID 0)
-- Dependencies: 261
-- Name: guest_review_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guest_review_settings_id_seq', 6, true);


--
-- TOC entry 5438 (class 0 OID 0)
-- Dependencies: 257
-- Name: guest_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guest_reviews_id_seq', 11, true);


--
-- TOC entry 5439 (class 0 OID 0)
-- Dependencies: 221
-- Name: hotels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hotels_id_seq', 20, true);


--
-- TOC entry 5440 (class 0 OID 0)
-- Dependencies: 247
-- Name: inspection_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspection_items_id_seq', 504, true);


--
-- TOC entry 5441 (class 0 OID 0)
-- Dependencies: 251
-- Name: inspection_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspection_results_id_seq', 22, true);


--
-- TOC entry 5442 (class 0 OID 0)
-- Dependencies: 253
-- Name: inspection_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspection_tasks_id_seq', 2, true);


--
-- TOC entry 5443 (class 0 OID 0)
-- Dependencies: 245
-- Name: inspection_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspection_types_id_seq', 3, true);


--
-- TOC entry 5444 (class 0 OID 0)
-- Dependencies: 249
-- Name: inspections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspections_id_seq', 12, true);


--
-- TOC entry 5445 (class 0 OID 0)
-- Dependencies: 238
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 100, true);


--
-- TOC entry 5446 (class 0 OID 0)
-- Dependencies: 259
-- Name: review_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_media_id_seq', 5, true);


--
-- TOC entry 5447 (class 0 OID 0)
-- Dependencies: 236
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 6, true);


--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 234
-- Name: room_production_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.room_production_id_seq', 1, false);


--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 243
-- Name: slides_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.slides_id_seq', 27, true);


--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 255
-- Name: trial_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trial_balances_id_seq', 6, true);


--
-- TOC entry 5451 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- TOC entry 5087 (class 2606 OID 34598)
-- Name: actual_dsr actual_dsr_hotel_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_dsr
    ADD CONSTRAINT actual_dsr_hotel_id_date_key UNIQUE (hotel_id, date);


--
-- TOC entry 5089 (class 2606 OID 34596)
-- Name: actual_dsr actual_dsr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_dsr
    ADD CONSTRAINT actual_dsr_pkey PRIMARY KEY (id);


--
-- TOC entry 5091 (class 2606 OID 34615)
-- Name: actuals actuals_hotel_id_year_account_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actuals
    ADD CONSTRAINT actuals_hotel_id_year_account_code_key UNIQUE (hotel_id, year, account_code);


--
-- TOC entry 5093 (class 2606 OID 34613)
-- Name: actuals actuals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actuals
    ADD CONSTRAINT actuals_pkey PRIMARY KEY (id);


--
-- TOC entry 5113 (class 2606 OID 34716)
-- Name: ar_aging ar_aging_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ar_aging
    ADD CONSTRAINT ar_aging_pkey PRIMARY KEY (id);


--
-- TOC entry 5143 (class 2606 OID 35332)
-- Name: audit_agendas audit_agendas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_agendas
    ADD CONSTRAINT audit_agendas_pkey PRIMARY KEY (id);


--
-- TOC entry 5145 (class 2606 OID 35360)
-- Name: audit_checklist_categories audit_checklist_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_categories
    ADD CONSTRAINT audit_checklist_categories_name_key UNIQUE (name);


--
-- TOC entry 5147 (class 2606 OID 35358)
-- Name: audit_checklist_categories audit_checklist_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_categories
    ADD CONSTRAINT audit_checklist_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5149 (class 2606 OID 35374)
-- Name: audit_checklist_items audit_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_items
    ADD CONSTRAINT audit_checklist_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5151 (class 2606 OID 35401)
-- Name: audit_results audit_results_agenda_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results
    ADD CONSTRAINT audit_results_agenda_id_item_id_key UNIQUE (agenda_id, item_id);


--
-- TOC entry 5153 (class 2606 OID 35399)
-- Name: audit_results audit_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results
    ADD CONSTRAINT audit_results_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 34433)
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- TOC entry 5083 (class 2606 OID 34549)
-- Name: budget_dsr budget_dsr_hotel_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_dsr
    ADD CONSTRAINT budget_dsr_hotel_id_date_key UNIQUE (hotel_id, date);


--
-- TOC entry 5085 (class 2606 OID 34547)
-- Name: budget_dsr budget_dsr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_dsr
    ADD CONSTRAINT budget_dsr_pkey PRIMARY KEY (id);


--
-- TOC entry 5079 (class 2606 OID 34500)
-- Name: budgets budgets_hotel_id_year_account_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_hotel_id_year_account_code_key UNIQUE (hotel_id, year, account_code);


--
-- TOC entry 5081 (class 2606 OID 34498)
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- TOC entry 5095 (class 2606 OID 34632)
-- Name: dsr_opening_balances dsr_opening_balances_hotel_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dsr_opening_balances
    ADD CONSTRAINT dsr_opening_balances_hotel_id_key UNIQUE (hotel_id);


--
-- TOC entry 5097 (class 2606 OID 34630)
-- Name: dsr_opening_balances dsr_opening_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dsr_opening_balances
    ADD CONSTRAINT dsr_opening_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 5139 (class 2606 OID 35259)
-- Name: guest_review_settings guest_review_settings_hotel_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_review_settings
    ADD CONSTRAINT guest_review_settings_hotel_id_key UNIQUE (hotel_id);


--
-- TOC entry 5141 (class 2606 OID 35257)
-- Name: guest_review_settings guest_review_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_review_settings
    ADD CONSTRAINT guest_review_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5135 (class 2606 OID 35214)
-- Name: guest_reviews guest_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_reviews
    ADD CONSTRAINT guest_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5073 (class 2606 OID 34470)
-- Name: hotels hotels_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotels
    ADD CONSTRAINT hotels_name_key UNIQUE (name);


--
-- TOC entry 5075 (class 2606 OID 34468)
-- Name: hotels hotels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotels
    ADD CONSTRAINT hotels_pkey PRIMARY KEY (id);


--
-- TOC entry 5122 (class 2606 OID 34763)
-- Name: inspection_items inspection_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_items
    ADD CONSTRAINT inspection_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5126 (class 2606 OID 34810)
-- Name: inspection_results inspection_results_inspection_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results
    ADD CONSTRAINT inspection_results_inspection_id_item_id_key UNIQUE (inspection_id, item_id);


--
-- TOC entry 5128 (class 2606 OID 34808)
-- Name: inspection_results inspection_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results
    ADD CONSTRAINT inspection_results_pkey PRIMARY KEY (id);


--
-- TOC entry 5130 (class 2606 OID 34851)
-- Name: inspection_tasks inspection_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks
    ADD CONSTRAINT inspection_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5118 (class 2606 OID 34750)
-- Name: inspection_types inspection_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_types
    ADD CONSTRAINT inspection_types_name_key UNIQUE (name);


--
-- TOC entry 5120 (class 2606 OID 34748)
-- Name: inspection_types inspection_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_types
    ADD CONSTRAINT inspection_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 2606 OID 34789)
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- TOC entry 5107 (class 2606 OID 34685)
-- Name: permissions permissions_action_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_action_key UNIQUE (action);


--
-- TOC entry 5109 (class 2606 OID 34683)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5137 (class 2606 OID 35229)
-- Name: review_media review_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_pkey PRIMARY KEY (id);


--
-- TOC entry 5111 (class 2606 OID 34690)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 5103 (class 2606 OID 34673)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5105 (class 2606 OID 34671)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5099 (class 2606 OID 34654)
-- Name: room_production room_production_hotel_id_date_segment_company_pic_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_production
    ADD CONSTRAINT room_production_hotel_id_date_segment_company_pic_name_key UNIQUE (hotel_id, date, segment, company, pic_name);


--
-- TOC entry 5101 (class 2606 OID 34652)
-- Name: room_production room_production_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_production
    ADD CONSTRAINT room_production_pkey PRIMARY KEY (id);


--
-- TOC entry 5116 (class 2606 OID 34732)
-- Name: slides slides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slides
    ADD CONSTRAINT slides_pkey PRIMARY KEY (id);


--
-- TOC entry 5133 (class 2606 OID 35134)
-- Name: trial_balances trial_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trial_balances
    ADD CONSTRAINT trial_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 5077 (class 2606 OID 34478)
-- Name: user_hotel_access user_hotel_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hotel_access
    ADD CONSTRAINT user_hotel_access_pkey PRIMARY KEY (user_id, hotel_id);


--
-- TOC entry 5067 (class 2606 OID 34458)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5069 (class 2606 OID 34454)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5071 (class 2606 OID 34456)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5114 (class 1259 OID 34739)
-- Name: idx_slides_position; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_slides_position ON public.slides USING btree ("position");


--
-- TOC entry 5131 (class 1259 OID 35167)
-- Name: idx_trial_balances_position; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trial_balances_position ON public.trial_balances USING btree ("position");


--
-- TOC entry 5192 (class 2620 OID 35474)
-- Name: audit_agendas set_timestamp_audit_agendas; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_audit_agendas BEFORE UPDATE ON public.audit_agendas FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5193 (class 2620 OID 35475)
-- Name: audit_checklist_categories set_timestamp_audit_checklist_categories; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_audit_checklist_categories BEFORE UPDATE ON public.audit_checklist_categories FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5194 (class 2620 OID 35476)
-- Name: audit_checklist_items set_timestamp_audit_checklist_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_audit_checklist_items BEFORE UPDATE ON public.audit_checklist_items FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5195 (class 2620 OID 35477)
-- Name: audit_results set_timestamp_audit_results; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_audit_results BEFORE UPDATE ON public.audit_results FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5191 (class 2620 OID 35473)
-- Name: guest_review_settings set_timestamp_guest_review_settings; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_guest_review_settings BEFORE UPDATE ON public.guest_review_settings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5190 (class 2620 OID 35472)
-- Name: guest_reviews set_timestamp_guest_reviews; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_guest_reviews BEFORE UPDATE ON public.guest_reviews FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5183 (class 2620 OID 35465)
-- Name: hotels set_timestamp_hotels; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_hotels BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5188 (class 2620 OID 35470)
-- Name: inspection_items set_timestamp_inspection_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_inspection_items BEFORE UPDATE ON public.inspection_items FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5187 (class 2620 OID 35469)
-- Name: inspection_types set_timestamp_inspection_types; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_inspection_types BEFORE UPDATE ON public.inspection_types FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5185 (class 2620 OID 35467)
-- Name: roles set_timestamp_roles; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_roles BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5184 (class 2620 OID 35466)
-- Name: room_production set_timestamp_room_production; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_room_production BEFORE UPDATE ON public.room_production FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5186 (class 2620 OID 35468)
-- Name: slides set_timestamp_slides; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_slides BEFORE UPDATE ON public.slides FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5189 (class 2620 OID 35471)
-- Name: trial_balances set_timestamp_trial_balances; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_trial_balances BEFORE UPDATE ON public.trial_balances FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5159 (class 2606 OID 34599)
-- Name: actual_dsr actual_dsr_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_dsr
    ADD CONSTRAINT actual_dsr_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5160 (class 2606 OID 34616)
-- Name: actuals actuals_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actuals
    ADD CONSTRAINT actuals_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 34717)
-- Name: ar_aging ar_aging_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ar_aging
    ADD CONSTRAINT ar_aging_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5179 (class 2606 OID 35333)
-- Name: audit_agendas audit_agendas_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_agendas
    ADD CONSTRAINT audit_agendas_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5180 (class 2606 OID 35375)
-- Name: audit_checklist_items audit_checklist_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_items
    ADD CONSTRAINT audit_checklist_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.audit_checklist_categories(id) ON DELETE CASCADE;


--
-- TOC entry 5181 (class 2606 OID 35402)
-- Name: audit_results audit_results_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results
    ADD CONSTRAINT audit_results_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.audit_agendas(id) ON DELETE CASCADE;


--
-- TOC entry 5182 (class 2606 OID 35407)
-- Name: audit_results audit_results_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results
    ADD CONSTRAINT audit_results_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.audit_checklist_items(id) ON DELETE CASCADE;


--
-- TOC entry 5154 (class 2606 OID 34868)
-- Name: books books_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE SET NULL;


--
-- TOC entry 5158 (class 2606 OID 34550)
-- Name: budget_dsr budget_dsr_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_dsr
    ADD CONSTRAINT budget_dsr_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5157 (class 2606 OID 34501)
-- Name: budgets budgets_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 34633)
-- Name: dsr_opening_balances dsr_opening_balances_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dsr_opening_balances
    ADD CONSTRAINT dsr_opening_balances_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5178 (class 2606 OID 35260)
-- Name: guest_review_settings guest_review_settings_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_review_settings
    ADD CONSTRAINT guest_review_settings_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5176 (class 2606 OID 35215)
-- Name: guest_reviews guest_reviews_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_reviews
    ADD CONSTRAINT guest_reviews_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5167 (class 2606 OID 34764)
-- Name: inspection_items inspection_items_inspection_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_items
    ADD CONSTRAINT inspection_items_inspection_type_id_fkey FOREIGN KEY (inspection_type_id) REFERENCES public.inspection_types(id) ON DELETE CASCADE;


--
-- TOC entry 5171 (class 2606 OID 34811)
-- Name: inspection_results inspection_results_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results
    ADD CONSTRAINT inspection_results_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;


--
-- TOC entry 5172 (class 2606 OID 34816)
-- Name: inspection_results inspection_results_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results
    ADD CONSTRAINT inspection_results_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inspection_items(id) ON DELETE CASCADE;


--
-- TOC entry 5173 (class 2606 OID 34862)
-- Name: inspection_tasks inspection_tasks_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks
    ADD CONSTRAINT inspection_tasks_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5174 (class 2606 OID 34852)
-- Name: inspection_tasks inspection_tasks_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks
    ADD CONSTRAINT inspection_tasks_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;


--
-- TOC entry 5175 (class 2606 OID 34857)
-- Name: inspection_tasks inspection_tasks_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks
    ADD CONSTRAINT inspection_tasks_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inspection_items(id) ON DELETE CASCADE;


--
-- TOC entry 5168 (class 2606 OID 34790)
-- Name: inspections inspections_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 34795)
-- Name: inspections inspections_inspection_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_inspection_type_id_fkey FOREIGN KEY (inspection_type_id) REFERENCES public.inspection_types(id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 34900)
-- Name: inspections inspections_inspector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5177 (class 2606 OID 35230)
-- Name: review_media review_media_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.guest_reviews(id) ON DELETE CASCADE;


--
-- TOC entry 5163 (class 2606 OID 34696)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 34691)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5162 (class 2606 OID 34655)
-- Name: room_production room_production_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_production
    ADD CONSTRAINT room_production_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5166 (class 2606 OID 34733)
-- Name: slides slides_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slides
    ADD CONSTRAINT slides_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 34484)
-- Name: user_hotel_access user_hotel_access_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hotel_access
    ADD CONSTRAINT user_hotel_access_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5156 (class 2606 OID 34479)
-- Name: user_hotel_access user_hotel_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hotel_access
    ADD CONSTRAINT user_hotel_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-12-19 14:40:48

--
-- PostgreSQL database dump complete
--

\unrestrict RL4PA0R9WwkBLVlRaCAAuwAHKNcqesyJ4LBC3KMZBrMoL1tafsgow8Hp92UOUo5

