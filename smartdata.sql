--
-- PostgreSQL database dump
--

\restrict iFufzem7y78Agdg3cKJeKz6r78AHaWpj4Vw2SIN7kn7pTQYcltWORwAgSm7o5at

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-12-26 07:58:30

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
-- TOC entry 994 (class 1247 OID 35312)
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
-- TOC entry 1006 (class 1247 OID 35382)
-- Name: audit_result_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_result_status AS ENUM (
    'pass',
    'fail',
    'n/a'
);


ALTER TYPE public.audit_result_status OWNER TO postgres;

--
-- TOC entry 976 (class 1247 OID 35116)
-- Name: audit_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.audit_status AS ENUM (
    'not_audited',
    'in_audit',
    'closed'
);


ALTER TYPE public.audit_status OWNER TO postgres;

--
-- TOC entry 958 (class 1247 OID 34771)
-- Name: inspection_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inspection_status AS ENUM (
    'in_progress',
    'completed',
    'pending_review'
);


ALTER TYPE public.inspection_status OWNER TO postgres;

--
-- TOC entry 982 (class 1247 OID 35192)
-- Name: review_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.review_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.review_status OWNER TO postgres;

--
-- TOC entry 970 (class 1247 OID 34832)
-- Name: task_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_priority AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE public.task_priority OWNER TO postgres;

--
-- TOC entry 967 (class 1247 OID 34822)
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
-- TOC entry 907 (class 1247 OID 34435)
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
-- TOC entry 275 (class 1255 OID 34459)
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_locked boolean DEFAULT false
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
-- TOC entry 5434 (class 0 OID 0)
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
-- TOC entry 5435 (class 0 OID 0)
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
-- TOC entry 5436 (class 0 OID 0)
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
-- TOC entry 5437 (class 0 OID 0)
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
-- TOC entry 5438 (class 0 OID 0)
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
-- TOC entry 5439 (class 0 OID 0)
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
-- TOC entry 5440 (class 0 OID 0)
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
-- TOC entry 5441 (class 0 OID 0)
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_locked boolean DEFAULT false
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
-- TOC entry 5442 (class 0 OID 0)
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
-- TOC entry 5443 (class 0 OID 0)
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
-- TOC entry 5444 (class 0 OID 0)
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
-- TOC entry 5445 (class 0 OID 0)
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
    voucher_number character varying(100),
    voucher_used_at timestamp with time zone,
    voucher_used_by_guest character varying(255),
    voucher_used_room_number character varying(50),
    voucher_used_folio_number character varying(100),
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
-- TOC entry 5446 (class 0 OID 0)
-- Dependencies: 257
-- Name: guest_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guest_reviews_id_seq OWNED BY public.guest_reviews.id;


--
-- TOC entry 272 (class 1259 OID 35518)
-- Name: hotel_competitor_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_competitor_data (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    date date NOT NULL,
    competitor_name character varying(255) NOT NULL,
    number_of_rooms integer,
    room_available integer,
    room_sold integer,
    occupancy_percent numeric(5,2),
    arr numeric(15,2),
    revpar numeric(15,2),
    revenue numeric(15,2),
    ari numeric(15,2),
    rgi numeric(15,2),
    mpi numeric(15,2),
    rank_mpi integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.hotel_competitor_data OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 35517)
-- Name: hotel_competitor_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_competitor_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hotel_competitor_data_id_seq OWNER TO postgres;

--
-- TOC entry 5447 (class 0 OID 0)
-- Dependencies: 271
-- Name: hotel_competitor_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_competitor_data_id_seq OWNED BY public.hotel_competitor_data.id;


--
-- TOC entry 274 (class 1259 OID 35556)
-- Name: hotel_competitors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_competitors (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    competitor_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    number_of_rooms integer,
    display_order integer
);


ALTER TABLE public.hotel_competitors OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 35555)
-- Name: hotel_competitors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_competitors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hotel_competitors_id_seq OWNER TO postgres;

--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 273
-- Name: hotel_competitors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_competitors_id_seq OWNED BY public.hotel_competitors.id;


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
    thumbnail_url text,
    number_of_rooms integer
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
-- TOC entry 5449 (class 0 OID 0)
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
-- TOC entry 5450 (class 0 OID 0)
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
-- TOC entry 5451 (class 0 OID 0)
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
-- TOC entry 5452 (class 0 OID 0)
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
-- TOC entry 5453 (class 0 OID 0)
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
-- TOC entry 5454 (class 0 OID 0)
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
-- TOC entry 5455 (class 0 OID 0)
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
-- TOC entry 5456 (class 0 OID 0)
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
-- TOC entry 5457 (class 0 OID 0)
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
-- TOC entry 5458 (class 0 OID 0)
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
-- TOC entry 5459 (class 0 OID 0)
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
-- TOC entry 5460 (class 0 OID 0)
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reset_password_token text,
    reset_password_expires timestamp with time zone
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
-- TOC entry 5461 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4956 (class 2604 OID 34559)
-- Name: actual_dsr id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_dsr ALTER COLUMN id SET DEFAULT nextval('public.actual_dsr_id_seq'::regclass);


--
-- TOC entry 4993 (class 2604 OID 34608)
-- Name: actuals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actuals ALTER COLUMN id SET DEFAULT nextval('public.actuals_id_seq'::regclass);


--
-- TOC entry 5010 (class 2604 OID 34705)
-- Name: ar_aging id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ar_aging ALTER COLUMN id SET DEFAULT nextval('public.ar_aging_id_seq'::regclass);


--
-- TOC entry 5056 (class 2604 OID 35325)
-- Name: audit_agendas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_agendas ALTER COLUMN id SET DEFAULT nextval('public.audit_agendas_id_seq'::regclass);


--
-- TOC entry 5060 (class 2604 OID 35353)
-- Name: audit_checklist_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_categories ALTER COLUMN id SET DEFAULT nextval('public.audit_checklist_categories_id_seq'::regclass);


--
-- TOC entry 5064 (class 2604 OID 35366)
-- Name: audit_checklist_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_items ALTER COLUMN id SET DEFAULT nextval('public.audit_checklist_items_id_seq'::regclass);


--
-- TOC entry 5069 (class 2604 OID 35393)
-- Name: audit_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results ALTER COLUMN id SET DEFAULT nextval('public.audit_results_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 34428)
-- Name: books id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 34510)
-- Name: budget_dsr id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_dsr ALTER COLUMN id SET DEFAULT nextval('public.budget_dsr_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 34493)
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- TOC entry 4995 (class 2604 OID 34625)
-- Name: dsr_opening_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dsr_opening_balances ALTER COLUMN id SET DEFAULT nextval('public.dsr_opening_balances_id_seq'::regclass);


--
-- TOC entry 5050 (class 2604 OID 35248)
-- Name: guest_review_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_review_settings ALTER COLUMN id SET DEFAULT nextval('public.guest_review_settings_id_seq'::regclass);


--
-- TOC entry 5044 (class 2604 OID 35203)
-- Name: guest_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_reviews ALTER COLUMN id SET DEFAULT nextval('public.guest_reviews_id_seq'::regclass);


--
-- TOC entry 5072 (class 2604 OID 35521)
-- Name: hotel_competitor_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_competitor_data ALTER COLUMN id SET DEFAULT nextval('public.hotel_competitor_data_id_seq'::regclass);


--
-- TOC entry 5075 (class 2604 OID 35559)
-- Name: hotel_competitors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_competitors ALTER COLUMN id SET DEFAULT nextval('public.hotel_competitors_id_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 34464)
-- Name: hotels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotels ALTER COLUMN id SET DEFAULT nextval('public.hotels_id_seq'::regclass);


--
-- TOC entry 5024 (class 2604 OID 34756)
-- Name: inspection_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_items ALTER COLUMN id SET DEFAULT nextval('public.inspection_items_id_seq'::regclass);


--
-- TOC entry 5033 (class 2604 OID 34804)
-- Name: inspection_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results ALTER COLUMN id SET DEFAULT nextval('public.inspection_results_id_seq'::regclass);


--
-- TOC entry 5035 (class 2604 OID 34843)
-- Name: inspection_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks ALTER COLUMN id SET DEFAULT nextval('public.inspection_tasks_id_seq'::regclass);


--
-- TOC entry 5021 (class 2604 OID 34744)
-- Name: inspection_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_types ALTER COLUMN id SET DEFAULT nextval('public.inspection_types_id_seq'::regclass);


--
-- TOC entry 5028 (class 2604 OID 34781)
-- Name: inspections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections ALTER COLUMN id SET DEFAULT nextval('public.inspections_id_seq'::regclass);


--
-- TOC entry 5009 (class 2604 OID 34679)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 5048 (class 2604 OID 35224)
-- Name: review_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media ALTER COLUMN id SET DEFAULT nextval('public.review_media_id_seq'::regclass);


--
-- TOC entry 5006 (class 2604 OID 34665)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4999 (class 2604 OID 34642)
-- Name: room_production id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_production ALTER COLUMN id SET DEFAULT nextval('public.room_production_id_seq'::regclass);


--
-- TOC entry 5018 (class 2604 OID 34726)
-- Name: slides id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slides ALTER COLUMN id SET DEFAULT nextval('public.slides_id_seq'::regclass);


--
-- TOC entry 5040 (class 2604 OID 35127)
-- Name: trial_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trial_balances ALTER COLUMN id SET DEFAULT nextval('public.trial_balances_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 34449)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5383 (class 0 OID 34556)
-- Dependencies: 229
-- Data for Name: actual_dsr; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actual_dsr (id, hotel_id, date, room_available, room_ooo, room_com_and_hu, room_sold, number_of_guest, occp_r_sold_percent, arr, revpar, lodging_revenue, others_room_revenue, room_revenue, breakfast_revenue, restaurant_revenue, room_service, banquet_revenue, fnb_others_revenue, fnb_revenue, others_revenue, total_revenue, service, tax, gross_revenue, shared_payable, deposit_reservation, cash_fo, cash_outlet, bank_transfer, qris, credit_debit_card, city_ledger, total_settlement, gab, balance, created_at, updated_at, is_locked) FROM stdin;
2	2	2025-12-01	131	0	0	108	219	82.00	445052.00	366913.00	48065564.00	0.00	48065564.00	7074380.00	256198.00	125621.00	2768595.00	0.00	10224794.00	0.00	58290358.00	5829036.00	6411939.00	70531333.00	0.00	0.00	0.00	102001.00	2550000.00	3460000.00	27161326.00	18592293.00	51865620.00	18665713.00	33978163.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
3	2	2025-12-02	130	1	0	112	240	86.00	472254.00	406865.00	52355255.00	537190.00	52892445.00	7074380.00	132231.00	417352.00	0.00	0.00	7623963.00	0.00	60516408.00	6051641.00	6656805.00	73224854.00	0.00	0.00	0.00	189996.00	31570000.00	4775000.00	39859804.00	7948305.00	84343105.00	-11118251.00	22859912.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
92	2	2024-12-29	131	0	0	129	270	98.00	581015.00	572144.00	74207083.47	743801.65	74950885.00	7735537.19	2125639.67	227272.73	0.00	0.00	10088450.00	0.00	85039335.00	8503933.00	9354327.00	102897595.00	0.00	0.00	2650000.00	1437024.00	2950000.00	1260000.00	5900000.00	105268954.00	119465978.00	-16568383.00	43411155.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
249	2	2024-11-01	131	0	0	131	262	100.00	442458.00	442458.00	57755444.00	206612.00	57962056.00	9371901.00	132231.00	128109.00	0.00	0.00	9632241.00	0.00	67594297.00	6759430.00	7485373.00	81839100.00	500000.00	0.00	0.00	315012.00	41825000.00	2950000.00	600000.00	33734476.00	79424488.00	2914612.00	2914612.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
250	2	2024-11-02	131	0	0	130	266	99.00	476604.00	472966.00	59603185.00	2355372.00	61958557.00	9520661.00	355372.00	0.00	0.00	0.00	9876033.00	0.00	71834590.00	7183459.00	8083623.00	87101672.00	1818182.00	0.00	6250000.00	0.00	22910000.00	2650000.00	3250000.00	31895558.00	66955558.00	21964296.00	24878908.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
67	2	2024-12-04	131	0	0	130	263	99.00	378450.00	375561.00	48764621.49	433884.30	49198506.00	9595041.32	380165.29	74380.17	0.00	0.00	10049587.00	0.00	59248093.00	5924809.00	6517290.00	71690192.00	0.00	0.00	4015000.00	0.00	28210000.00	875000.00	1900000.00	30252390.00	65252390.00	6437802.00	-22313309.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
68	2	2024-12-05	131	0	0	131	263	100.00	397615.00	397615.00	51385099.17	702479.34	52087579.00	9743801.65	1022314.05	0.00	3099173.55	0.00	13865289.00	0.00	65952868.00	6595287.00	7254815.00	79802970.00	0.00	0.00	300000.00	237000.00	15270000.00	7820000.00	24970000.00	29314858.00	77911858.00	1891112.00	-20422197.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
69	2	2024-12-06	131	0	0	131	262	100.00	430757.00	430757.00	55458080.99	971074.38	56429155.00	9743801.65	1309090.91	0.00	0.00	0.00	11052893.00	0.00	67482048.00	6748205.00	7423025.00	81653278.00	0.00	0.00	4710000.00	80000.00	11580000.00	5050000.00	4850000.00	32299650.00	58569650.00	23083628.00	2661431.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
252	2	2024-11-04	131	0	0	128	256	98.00	398905.00	389770.00	50977184.00	82645.00	51059829.00	8888430.00	17107438.00	37200.00	6384298.00	0.00	32417366.00	24793.00	83501988.00	8350199.00	10253400.00	102105587.00	10681818.00	0.00	2500000.00	45012.00	38100000.00	1400000.00	12475018.00	15084526.00	69604556.00	43182849.00	-59787063.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
265	2	2024-11-17	131	0	0	60	121	46.00	400330.00	183357.00	23606601.00	413223.00	24019824.00	3719008.00	801673.00	216530.00	0.00	0.00	4737211.00	0.00	28757035.00	2875703.00	3163274.00	34796012.00	0.00	0.00	5700000.00	410024.00	31390000.00	3250000.00	1400000.00	55748566.00	97898590.00	-63102578.00	-114485391.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
266	2	2024-11-18	131	0	0	128	257	98.00	418582.00	408996.00	52917323.00	661157.00	53578480.00	9000000.00	113223.00	0.00	0.00	0.00	9113223.00	0.00	62691703.00	6269170.00	6959724.00	75920597.00	636364.00	0.00	1950000.00	57000.00	18000000.00	5200000.00	3900000.00	20950323.00	50057323.00	26499638.00	-87985753.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
267	2	2024-11-19	131	0	0	131	262	100.00	428995.00	428995.00	55495808.00	702479.00	56198287.00	9446281.00	82645.00	0.00	4132231.00	0.00	13661157.00	0.00	69859444.00	6985944.00	7748175.00	84593563.00	636364.00	0.00	1450000.00	0.00	12460000.00	8900000.00	11400000.00	30663657.00	64873657.00	20356270.00	-67629483.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
268	2	2024-11-20	131	0	0	131	264	100.00	420978.00	420978.00	54507663.00	640496.00	55148159.00	9148760.00	82645.00	144628.00	0.00	0.00	9376033.00	0.00	64524192.00	6452419.00	7097661.00	78074272.00	0.00	0.00	550000.00	100000.00	43930000.00	1925000.00	2400000.00	31418002.00	80323002.00	-2248730.00	-69878213.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
4	2	2025-12-03	131	0	0	122	261	93.00	494920.00	460918.00	60008358.00	371901.00	60380259.00	7669421.00	157025.00	0.00	2148760.00	0.00	9975206.00	16529.00	70371994.00	7037199.00	7740919.00	85150112.00	0.00	0.00	0.00	160000.00	24750000.00	3950000.00	17800090.00	14816444.00	61476534.00	23673578.00	46533490.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
70	2	2024-12-07	131	0	0	131	270	100.00	451901.00	451901.00	58207355.37	991735.54	59199091.00	9520661.16	148760.33	74380.17	9917355.37	0.00	19661157.00	0.00	78860248.00	7886025.00	8674627.00	95420900.00	0.00	0.00	0.00	90000.00	10675000.00	3950000.00	7025000.00	53704226.00	75444226.00	19976674.00	22638105.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
71	2	2024-12-08	131	0	0	88	178	67.00	378137.00	254016.00	33069430.58	206611.57	33276042.00	5652892.56	330578.51	194214.88	0.00	0.00	6177686.00	0.00	39453728.00	3945373.00	4339910.00	47739011.00	0.00	0.00	500000.00	435000.00	6100000.00	800000.00	3300000.00	69980664.00	81115664.00	-33376653.00	-10738548.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
155	2	2024-12-31	131	0	0	131	273	100.00	896466.00	896466.00	114792398.35	2644628.10	117437026.00	10826446.28	954545.46	0.00	20206611.57	0.00	31987603.00	0.00	149424630.00	14942463.00	16436709.00	180803802.00	0.00	0.00	1350000.00	475000.00	26275000.00	680000.00	675000.00	77103699.00	106558699.00	74245103.00	121112356.00	2025-12-25 19:44:52.158129+07	2025-12-26 04:06:37.635053+07	t
78	2	2024-12-15	131	0	0	80	160	61.00	438385.00	267716.00	34636915.70	433884.30	35070800.00	4760330.58	198347.11	243801.65	0.00	0.00	5202479.00	0.00	40273279.00	4027328.00	4430061.00	48730668.00	0.00	0.00	1100000.00	295000.00	70450000.00	550000.00	1875000.00	28550898.00	102820898.00	-54090230.00	-19052053.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
79	2	2024-12-16	131	0	0	131	266	100.00	437303.00	437303.00	56377541.32	909090.91	57286632.00	9595041.32	363636.36	123966.94	0.00	0.00	10082645.00	0.00	67369277.00	6736928.00	7410620.00	81516825.00	0.00	0.00	1760000.00	80000.00	3920000.00	2980000.00	39850000.00	40948128.00	89538128.00	-8021303.00	-27073356.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
80	2	2024-12-17	131	0	0	131	262	100.00	430986.00	430986.00	56004561.98	454545.45	56459107.00	9743801.65	380165.29	24793.39	0.00	0.00	10148760.00	0.00	66607868.00	6660787.00	7326865.00	80595520.00	0.00	0.00	0.00	180000.00	0.00	1850000.00	1850000.00	52566921.00	56446921.00	24148599.00	-2924757.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
90	2	2024-12-27	131	0	0	129	288	98.00	662315.00	652203.00	83951001.65	1487603.31	85438605.00	10264462.81	929752.06	165288.43	0.00	0.00	11359503.00	0.00	96798108.00	9679811.00	10647792.00	117125711.00	0.00	0.00	0.00	674999.00	6300000.00	650000.00	0.00	93015580.00	100640579.00	16485132.00	52027317.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
89	2	2024-12-26	131	0	0	130	272	99.00	646946.00	642007.00	80838458.68	3264462.81	84102921.00	9074380.17	735537.18	78511.57	0.00	0.00	9888429.00	0.00	93991350.00	9399135.00	10339049.00	113729534.00	0.00	0.00	1100000.00	170000.00	5200000.00	814999.00	12550000.00	85183096.00	105018095.00	8711439.00	35542185.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
93	2	2024-12-30	131	0	0	129	260	98.00	671052.00	660807.00	85119448.76	1446280.99	86565730.00	7768595.04	1475276.03	99173.55	0.00	0.00	9343045.00	0.00	95908774.00	9590877.00	10549965.00	116049616.00	0.00	0.00	1800000.00	790084.00	3350000.00	1115000.00	900000.00	104638434.00	112593518.00	3456098.00	46867253.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
7	2	2025-12-06	131	0	0	69	138	53.00	408121.00	214964.00	27953730.00	206612.00	28160342.00	5132231.00	909091.00	90909.00	0.00	0.00	6132231.00	49587.00	34342160.00	3434216.00	3777638.00	41554014.00	0.00	0.00	0.00	0.00	40042000.00	1460000.00	43143926.00	18750032.00	103395958.00	-61841944.00	1042242.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
8	2	2025-12-07	131	0	0	110	220	84.00	449547.00	377482.00	48788992.00	661157.00	49450149.00	7140496.00	338843.00	0.00	1033058.00	0.00	8512397.00	0.00	57962546.00	5796255.00	6375880.00	70134681.00	0.00	0.00	600000.00	100000.00	2500000.00	8660000.00	37962618.00	7811662.00	57634280.00	12500401.00	13542643.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
9	2	2025-12-08	131	0	0	125	250	95.00	493132.00	470546.00	59616736.00	2024793.00	61641529.00	8165289.00	462810.00	136364.00	3099174.00	0.00	11863637.00	0.00	73505166.00	7350517.00	8085568.00	88941251.00	0.00	0.00	0.00	65000.00	10650000.00	660000.00	23896510.00	11068455.00	46339965.00	42601286.00	56143929.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
10	2	2025-12-09	131	0	0	131	263	100.00	485377.00	485377.00	63584373.00	0.00	63584373.00	8595041.00	318182.00	0.00	3636364.00	0.00	12549587.00	132231.00	76266191.00	7626619.00	8389281.00	92282091.00	0.00	0.00	1100000.00	305000.00	25800000.00	140000.00	15023712.00	45240865.00	87609577.00	4672514.00	60816443.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
748	2	2025-11-03	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
750	2	2025-11-04	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
752	2	2025-11-05	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
754	2	2025-11-06	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
756	2	2025-11-07	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
758	2	2025-11-08	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
760	2	2025-11-09	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
64	2	2024-12-01	131	0	0	78	157	60.00	396970.00	236364.00	30757066.12	206611.57	30963678.00	5355371.90	809917.36	20661.16	0.00	0.00	6185950.00	0.00	37149628.00	3714963.00	4086459.00	44951050.00	0.00	0.00	2100000.00	25000.00	1485000.00	0.00	600000.00	98508080.00	102718080.00	-57767030.00	-57767030.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
65	2	2024-12-02	131	0	0	124	249	95.00	380261.00	359942.00	46945803.31	206611.57	47152415.00	8888429.75	148760.33	165299.18	0.00	0.00	9202489.00	0.00	56354904.00	5635490.00	6199039.00	68189433.00	0.00	0.00	1100000.00	125000.00	10600000.00	4380000.00	4660000.00	27531750.00	48396750.00	19792683.00	-37974347.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
66	2	2024-12-03	131	0	0	130	262	99.00	374426.00	371568.00	48241515.70	433884.30	48675400.00	9669421.49	242148.76	148760.33	0.00	0.00	10060331.00	0.00	58735731.00	5873573.00	6460930.00	71070234.00	0.00	0.00	0.00	180000.00	19850000.00	1750000.00	10524000.00	29542998.00	61846998.00	9223236.00	-28751111.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
762	2	2025-11-10	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
764	2	2025-11-11	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
744	2	2025-11-01	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
746	2	2025-11-02	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
766	2	2025-11-12	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
768	2	2025-11-13	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
770	2	2025-11-14	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
772	2	2025-11-15	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
774	2	2025-11-16	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
776	2	2025-11-17	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
63	2	2024-11-30	131	0	0	131	265	100.00	510978.00	510978.00	65946329.00	991736.00	66938065.00	9743802.00	561983.00	483471.00	4958678.00	0.00	15747934.00	0.00	82685999.00	8268600.00	9095460.00	100050059.00	0.00	0.00	3450000.00	655000.00	32200000.00	5700000.00	2600000.00	35538828.00	80143828.00	19906231.00	-25702390.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:58:04.790236+07	t
251	2	2024-11-03	131	0	0	42	88	32.00	384439.00	123255.00	16146450.00	0.00	16146450.00	2380165.00	512397.00	0.00	17004132.00	0.00	19896694.00	0.00	36043144.00	3604314.00	3964746.00	43612204.00	0.00	0.00	0.00	260000.00	118775000.00	2200000.00	12500000.00	37726024.00	171461024.00	-127848820.00	-102969912.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
253	2	2024-11-05	131	0	0	126	258	96.00	385437.00	370725.00	48337766.00	227273.00	48565039.00	9297521.00	0.00	111570.00	4462810.00	0.00	13871901.00	0.00	62436940.00	6243694.00	7418063.00	76098697.00	5500000.00	0.00	0.00	0.00	24150000.00	1475000.00	6550000.00	11325704.00	43500704.00	38097993.00	-21689070.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
254	2	2024-11-06	131	0	0	130	262	99.00	398945.00	395900.00	51656258.00	206612.00	51862870.00	9371901.00	330579.00	0.00	2582645.00	0.00	12285125.00	0.00	64147995.00	6414799.00	7056279.00	77619073.00	0.00	0.00	4025000.00	0.00	46300000.00	1800000.00	69120000.00	28170296.00	149415296.00	-71796223.00	-93485293.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
272	2	2024-11-24	131	0	0	87	178	66.00	402194.00	267106.00	34990855.00	0.00	34990855.00	6024793.00	611570.00	95041.00	1818182.00	0.00	8549586.00	0.00	43540441.00	4354044.00	4789449.00	52683934.00	0.00	0.00	1500000.00	30000.00	44430000.00	1750000.00	500000.00	53118732.00	101328732.00	-48644798.00	-94113261.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
5	2	2025-12-04	131	0	0	133	273	102.00	540085.00	548331.00	71087541.00	743802.00	71831343.00	8727273.00	231405.00	0.00	1446281.00	0.00	10404959.00	123967.00	82360269.00	8236027.00	9059629.00	99655925.00	0.00	0.00	3900000.00	0.00	14500000.00	4530000.00	29019421.00	13376860.00	65326281.00	34329644.00	80863134.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
88	2	2024-12-25	131	0	0	131	271	100.00	677725.00	677725.00	85434899.17	3347107.44	88782007.00	9669421.49	1797550.41	181818.18	0.00	0.00	11648790.00	0.00	100430797.00	10043080.00	11047388.00	121521265.00	0.00	0.00	100000.00	1155000.00	10800000.00	1240036.00	8321305.00	77232746.00	98849087.00	22672178.00	26830746.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
6	2	2025-12-05	131	0	0	129	263	98.00	556712.00	548213.00	69129924.00	2685950.00	71815874.00	9595041.00	380165.00	128099.00	826446.00	0.00	10929751.00	0.00	82745625.00	8274563.00	9102019.00	100122207.00	0.00	0.00	3250000.00	200000.00	27750000.00	9715000.00	38395113.00	38791042.00	118101155.00	-17978948.00	62884186.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
30	2	2025-12-29	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	62417785.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
31	2	2025-12-30	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	62417785.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
91	2	2024-12-28	131	0	0	131	268	100.00	812780.00	812780.00	102961747.93	3512396.69	106474145.00	9669421.49	1132231.40	37200.00	0.00	0.00	10838853.00	289256.00	117602254.00	11760225.00	12936248.00	142298727.00	0.00	0.00	0.00	255012.00	56050000.00	310000.00	1100000.00	76631494.00	134346506.00	7952221.00	59979538.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
72	2	2024-12-09	131	0	0	130	264	99.00	414779.00	411613.00	53218770.25	702479.34	53921250.00	8888429.75	247933.89	111600.00	15082644.62	0.00	24330608.00	0.00	78251858.00	7825186.00	8607704.00	94684748.00	0.00	0.00	1100000.00	175036.00	19630000.00	5350000.00	7960000.00	26225161.00	60440197.00	34244551.00	23506003.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
73	2	2024-12-10	131	0	0	130	255	99.00	436439.00	433107.00	54794905.79	1942148.76	56737055.00	9409090.91	148760.33	198347.11	12148760.33	0.00	21904959.00	16529.00	78658542.00	7865854.00	8652440.00	95176836.00	0.00	0.00	1650000.00	100000.00	27320000.00	1500000.00	0.00	30230946.00	60800946.00	34375890.00	57881893.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
74	2	2024-12-11	131	0	0	131	262	100.00	405872.00	405872.00	51805550.41	1363636.36	53169187.00	8553719.01	165289.25	322314.04	1818181.82	0.00	10859504.00	0.00	64028691.00	6402869.00	7043156.00	77474716.00	0.00	0.00	4250000.00	235000.00	49450000.00	5186000.00	8250000.00	44552372.00	111923372.00	-34448656.00	23433237.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
75	2	2024-12-12	131	0	0	129	283	98.00	435648.00	428996.00	55496049.59	702479.34	56198529.00	10376033.06	549586.77	95041.33	4752066.12	0.00	15772727.00	0.00	71971256.00	7197126.00	7916838.00	87085220.00	0.00	0.00	0.00	0.00	2800000.00	4650000.00	4200000.00	68884594.00	80534594.00	6550626.00	29983863.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
76	2	2024-12-13	131	0	0	131	274	100.00	453363.00	453363.00	58026885.12	1363636.36	59390521.00	9743801.65	578512.40	0.00	24070247.93	0.00	34392562.00	413223.00	94196306.00	9419631.00	10361594.00	113977531.00	0.00	0.00	2550000.00	0.00	121550000.00	2550000.00	7200000.00	24624618.00	158474618.00	-44497087.00	-14513224.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
269	2	2024-11-21	131	0	0	129	263	98.00	416589.00	410229.00	52706978.00	1033058.00	53740036.00	9595041.00	413223.00	0.00	5000000.00	0.00	15008264.00	0.00	68748300.00	6874830.00	7562313.00	83185443.00	0.00	0.00	2550000.00	200000.00	79550000.00	2650000.00	2450000.00	33873298.00	121273298.00	-38087855.00	-107966068.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
270	2	2024-11-22	131	0	0	130	267	99.00	450355.00	446918.00	57120577.00	1425620.00	58546197.00	8851240.00	386777.00	330598.00	13793388.00	0.00	23362003.00	267769.00	82175969.00	8217597.00	9039356.00	99432922.00	0.00	0.00	2550000.00	200000.00	24661001.00	5225000.00	2700000.00	25342135.00	60678136.00	38754786.00	-69211282.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
271	2	2024-11-23	131	0	0	129	271	98.00	484036.00	476646.00	62440635.00	0.00	62440635.00	9892562.00	272727.00	0.00	0.00	0.00	10165289.00	0.00	72605924.00	7260592.00	7986652.00	87853168.00	0.00	0.00	619999.00	260000.00	4050000.00	2100000.00	0.00	57080350.00	64110349.00	23742819.00	-45468463.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
784	2	2025-11-21	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
786	2	2025-11-22	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
788	2	2025-11-23	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
77	2	2024-12-14	131	0	0	128	262	98.00	463055.00	452450.00	58816434.71	454545.45	59270980.00	9520661.16	413223.14	0.00	25884297.52	0.00	35818182.00	0.00	95089162.00	9508916.00	10549064.00	115147142.00	892562.00	0.00	650000.00	100000.00	7940000.00	7900000.00	0.00	49898303.00	66488303.00	49551401.00	35038177.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
790	2	2025-11-24	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
81	2	2024-12-18	131	0	0	131	265	100.00	456946.00	456946.00	58950856.20	909090.91	59859947.00	8925619.83	0.00	0.00	0.00	0.00	8925620.00	0.00	68785567.00	6878557.00	7566412.00	83230536.00	0.00	0.00	3394000.00	0.00	35315000.00	3150000.00	4700000.00	60611278.00	107170278.00	-23939742.00	-26864499.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
792	2	2025-11-25	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
82	2	2024-12-19	131	0	0	131	266	100.00	440780.00	440780.00	56791750.41	950413.22	57742164.00	9818181.82	82644.63	0.00	1446280.99	0.00	11347107.00	0.00	69089271.00	6908927.00	7599820.00	83598018.00	0.00	0.00	2900.00	100000.00	29822100.00	3750000.00	5700000.00	47611754.00	86986754.00	-3388736.00	-30253235.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
794	2	2025-11-26	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
83	2	2024-12-20	131	0	0	131	262	100.00	503859.00	503859.00	64001361.16	2004132.23	66005493.00	9595041.32	66115.70	119834.71	23950413.22	0.00	33731405.00	0.00	99736898.00	9973690.00	10971059.00	120681647.00	0.00	0.00	1200000.00	0.00	18750000.00	550000.00	1950000.00	28848750.00	51298750.00	69382897.00	39129662.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
796	2	2025-11-27	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
84	2	2024-12-21	131	0	0	131	265	100.00	636240.00	636240.00	81322654.55	2024793.39	83347448.00	8628099.17	165289.25	0.00	3305785.12	0.00	12099174.00	0.00	95446621.00	9544662.00	10499128.00	115490411.00	0.00	0.00	0.00	0.00	45895000.00	6200000.00	2550000.00	16760539.00	71405539.00	44084872.00	83214534.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
798	2	2025-11-28	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
85	2	2024-12-22	131	0	0	126	260	96.00	489890.00	471192.00	61147681.82	578512.40	61726194.00	9148760.33	1090909.09	8263.64	0.00	0.00	10247933.00	16529.00	71990656.00	7199066.00	7918972.00	87108694.00	0.00	0.00	0.00	169999.00	10300000.00	1160000.00	19800000.00	63391260.00	94821259.00	-7712565.00	75501969.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
86	2	2024-12-23	131	0	0	131	265	100.00	483171.00	483171.00	62716831.40	578512.40	63295344.00	8776859.50	667768.59	0.00	0.00	0.00	9444628.00	16529.00	72756501.00	7275650.00	8003215.00	88035366.00	0.00	0.00	550000.00	100000.00	121588000.00	708000.00	5150000.00	45056928.00	173152928.00	-85117562.00	-9615593.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
778	2	2025-11-18	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
800	2	2025-11-29	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
87	2	2024-12-24	131	0	0	131	274	100.00	582815.00	582815.00	74261994.21	2086776.86	76348771.00	7809917.36	590909.09	37200.00	4958677.69	0.00	13396704.00	0.00	89745475.00	8974548.00	9872002.00	108592025.00	0.00	0.00	1375000.00	360012.00	8500000.00	400000.00	3400000.00	80782852.00	94817864.00	13774161.00	4158568.00	2025-12-25 19:31:32.963158+07	2025-12-26 04:06:37.635053+07	t
780	2	2025-11-19	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
782	2	2025-11-20	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
802	2	2025-11-30	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:43:55.594786+07	2025-12-25 21:43:55.594786+07	f
273	2	2024-11-25	131	0	0	60	121	46.00	390958.00	179065.00	23457493.00	0.00	23457493.00	3272727.00	0.00	0.00	0.00	0.00	3272727.00	0.00	26730220.00	2673022.00	2940324.00	32343566.00	0.00	0.00	0.00	0.00	29290000.00	0.00	2700000.00	15189651.00	47179651.00	-14836085.00	-108949346.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
274	2	2024-11-26	131	0	0	50	101	38.00	374830.00	143065.00	18514236.00	227273.00	18741509.00	2900826.00	16529.00	0.00	0.00	0.00	2917355.00	801653.00	22460517.00	2246052.00	2470657.00	27177226.00	0.00	0.00	0.00	20000.00	550000.00	8575000.00	3550000.00	30759376.00	43454376.00	-16277150.00	-125226496.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
277	2	2024-11-29	131	0	0	131	264	100.00	445922.00	445922.00	57424049.00	991736.00	58415785.00	9446281.00	249587.00	70248.00	12396694.00	0.00	22162810.00	0.00	80578595.00	8057859.00	8863645.00	97500099.00	0.00	0.00	0.00	202000.00	750000.00	300000.00	5350000.00	45118758.00	51720758.00	45779341.00	-45608621.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
258	2	2024-11-10	131	0	0	65	131	50.00	397595.00	197280.00	25616422.00	227273.00	25843695.00	3644628.00	661157.00	123977.00	0.00	0.00	4429762.00	41322.00	30314779.00	3031478.00	3334626.00	36680883.00	0.00	0.00	0.00	590012.00	1900000.00	925000.00	2350000.00	59866120.00	65631132.00	-28950249.00	-101747382.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
256	2	2024-11-08	131	0	0	130	258	99.00	436184.00	432855.00	55856855.00	847107.00	56703962.00	9520661.00	9454545.00	0.00	17528926.00	0.00	36504132.00	0.00	93208094.00	9320809.00	10352890.00	112881793.00	1000000.00	0.00	6230000.00	0.00	84535000.00	1280000.00	10150000.00	26732294.00	128927294.00	-15045501.00	-104913117.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
257	2	2024-11-09	131	0	0	131	266	100.00	518700.00	518700.00	66606765.00	1342975.00	67949740.00	9743802.00	380165.00	173554.00	495868.00	0.00	10793389.00	0.00	78743129.00	7874313.00	8661744.00	95279186.00	0.00	0.00	0.00	300000.00	39620000.00	550000.00	2250000.00	20443202.00	63163202.00	32115984.00	-72797133.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
11	2	2025-12-10	131	0	0	131	265	100.00	521649.00	521649.00	67075749.00	1260331.00	68336080.00	8661157.00	0.00	0.00	1033058.00	0.00	9694215.00	0.00	78030295.00	7803029.00	8583332.00	94416656.00	0.00	0.00	7700000.00	0.00	34400000.00	5525000.00	28275057.00	31825615.00	107725672.00	-13309016.00	47507427.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
12	2	2025-12-11	131	0	0	131	265	100.00	536320.00	536320.00	69307509.00	950413.00	70257922.00	8595041.00	53719.00	0.00	13429752.00	0.00	22078512.00	0.00	92336434.00	9233643.00	10157008.00	111727085.00	0.00	0.00	0.00	40000.00	8740000.00	4585000.00	59097844.00	28451427.00	100914271.00	10812814.00	58320241.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
13	2	2025-12-12	131	0	0	131	265	100.00	617707.00	617707.00	76415494.00	4504132.00	80919626.00	9743802.00	619835.00	57850.00	0.00	0.00	10421487.00	82645.00	91423758.00	9142376.00	10056613.00	110622747.00	0.00	0.00	300000.00	0.00	44830000.00	4959999.00	32194772.00	13111182.00	95395953.00	15226794.00	73547035.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
14	2	2025-12-13	131	0	0	102	209	78.00	418729.00	326033.00	40561550.00	2148760.00	42710310.00	6545455.00	586777.00	261984.00	2975207.00	0.00	10369423.00	41322.00	53121055.00	5312105.00	5843316.00	64276476.00	0.00	0.00	0.00	0.00	13050000.00	7915712.00	50162812.00	30794264.00	101922788.00	-37646312.00	35900723.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
15	2	2025-12-14	131	0	0	105	217	80.00	431474.00	345838.00	43817205.00	1487603.00	45304808.00	6942149.00	677686.00	0.00	5123967.00	0.00	12743802.00	0.00	58048610.00	5804861.00	6385347.00	70238818.00	0.00	0.00	1050000.00	0.00	8950000.00	5720000.00	46251224.00	13183028.00	75154252.00	-4915434.00	30985289.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
16	2	2025-12-15	131	0	0	116	237	89.00	447517.00	396274.00	51209475.00	702479.00	51911954.00	7570248.00	677686.00	0.00	1652893.00	0.00	9900827.00	0.00	61812781.00	6181278.00	6799406.00	74793465.00	0.00	0.00	2150000.00	0.00	14550000.00	4620000.00	31733753.00	16745681.00	69799434.00	4994031.00	35979320.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
17	2	2025-12-16	131	0	0	131	268	100.00	546420.00	546420.00	68399219.83	3181818.18	71581038.00	8595041.32	888429.74	0.00	2768595.04	0.00	12252066.00	0.00	83833104.00	8758992.00	9634891.00	102226987.00	3825000.00	0.00	0.00	0.00	8150000.00	6242500.00	22902936.00	23201874.00	60497310.00	45554677.00	81533997.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
18	2	2025-12-17	131	0	0	130	265	99.00	550842.00	546637.00	68551586.78	3057851.24	71609438.00	8595041.32	157024.79	190082.64	20002066.12	0.00	28944215.00	0.00	100553653.00	10437865.00	11481652.00	122473170.00	3825000.00	0.00	1450000.00	230000.00	73000000.00	3190000.00	29409744.00	31166585.00	138446329.00	-12148159.00	69385838.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
19	2	2025-12-18	131	0	0	131	265	100.00	583541.00	583541.00	73943814.05	2500000.00	76443814.00	8661157.02	214876.03	8263.64	2066115.70	0.00	10950412.00	0.00	87394226.00	9121923.00	10034115.00	106550264.00	3825000.00	0.00	0.00	0.00	24505000.00	1519999.00	30065710.00	10004344.00	66095053.00	44280211.00	113666049.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
20	2	2025-12-19	131	0	0	130	265	99.00	696048.00	690735.00	87738338.02	2747933.88	90486272.00	9669421.49	528925.62	553719.01	9586776.86	0.00	20338843.00	826446.00	111651561.00	11165156.00	12281672.00	135098389.00	0.00	0.00	200000.00	655000.00	63730000.00	5055000.00	49691579.00	13618122.00	132949701.00	2148688.00	115814737.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
21	2	2025-12-20	131	0	0	112	228	85.00	505960.00	432576.00	54807992.56	1859504.13	56667497.00	6347107.44	1314049.58	295042.15	0.00	0.00	7956199.00	24793.00	64648489.00	6464849.00	7111334.00	78224672.00	0.00	0.00	1850000.00	500000.00	50500000.00	5599501.00	39894195.00	9450180.00	107793876.00	-29569204.00	86245533.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
261	2	2024-11-13	131	0	0	131	261	100.00	398838.00	398838.00	52247752.00	0.00	52247752.00	9260331.00	165289.00	70248.00	12479339.00	0.00	21975207.00	0.00	74222959.00	7422296.00	8164525.00	89809780.00	0.00	0.00	9660000.00	85000.00	34690000.00	3550000.00	5572000.00	44288302.00	97845302.00	-8035522.00	-92247906.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
262	2	2024-11-14	131	0	0	131	261	100.00	415435.00	415435.00	54000448.00	421488.00	54421936.00	9185950.00	1322314.00	33058.00	16280992.00	0.00	26822314.00	0.00	81244250.00	8124425.00	8936867.00	98305542.00	0.00	0.00	1450000.00	40000.00	20075000.00	1900000.00	4670000.00	32796627.00	60931627.00	37373915.00	-54873991.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
263	2	2024-11-15	131	0	0	131	264	100.00	452277.00	452277.00	58690452.00	557851.00	59248303.00	9371901.00	198347.00	0.00	8851240.00	0.00	18421488.00	0.00	77669791.00	7766979.00	8728222.00	94164992.00	1845455.00	0.00	0.00	40000.00	31140000.00	900000.00	1350000.00	58364582.00	91794582.00	4215865.00	-50658126.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
264	2	2024-11-16	131	0	0	130	270	99.00	510362.00	506466.00	64818145.00	1528926.00	66347071.00	9818182.00	702479.00	194215.00	0.00	0.00	10714876.00	0.00	77061947.00	7706195.00	8476814.00	93244956.00	0.00	0.00	3100000.00	300000.00	25450000.00	1050000.00	3870000.00	60199643.00	93969643.00	-724687.00	-51382813.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
22	2	2025-12-21	130	1	0	130	262	100.00	606465.00	606465.00	77104941.32	1735537.19	78840479.00	8595041.32	1661983.48	0.00	8677685.95	0.00	18934711.00	859504.00	98634693.00	9863469.00	10849816.00	119347978.00	0.00	0.00	2350000.00	301000.00	17190000.00	2160000.00	71832577.00	50775892.00	144609469.00	-25261491.00	60984042.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
23	2	2025-12-22	131	0	0	131	264	100.00	582853.00	582853.00	75114109.09	1239669.42	76353779.00	8661157.02	1099173.56	0.00	5165289.26	0.00	14925620.00	2132231.00	93411629.00	9341163.00	10275279.00	113028071.00	0.00	0.00	1750000.00	0.00	37050000.00	13360000.00	33541834.00	14676620.00	100378454.00	12649617.00	73633659.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
24	2	2025-12-23	131	0	0	131	272	100.00	652035.00	652035.00	82482718.18	2933884.29	85416602.00	8528925.62	1223140.50	173552.89	1652892.56	0.00	11578512.00	0.00	96995114.00	9699511.00	10669463.00	117364088.00	0.00	0.00	1400000.00	90000.00	12850000.00	9099999.00	73393910.00	31746053.00	128579962.00	-11215874.00	62417785.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
25	2	2025-12-24	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	62417785.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
26	2	2025-12-25	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	62417785.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
27	2	2025-12-26	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	62417785.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
28	2	2025-12-27	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	62417785.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
29	2	2025-12-28	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	62417785.00	2025-12-17 17:02:00.620624+07	2025-12-25 19:08:47.94212+07	f
255	2	2024-11-07	131	0	0	130	263	99.00	396162.00	393138.00	51067164.00	433884.00	51501048.00	9520661.00	479339.00	0.00	7438017.00	0.00	17438017.00	413223.00	69352288.00	6935229.00	7728752.00	84016269.00	1000000.00	0.00	3550000.00	0.00	58575000.00	1950000.00	275000.00	17048592.00	81398592.00	3617677.00	-89867616.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
259	2	2024-11-11	131	0	0	105	213	80.00	405631.00	325124.00	42054040.00	537190.00	42591230.00	6433884.00	279008.00	70248.00	3884298.00	0.00	10667438.00	123967.00	53382635.00	5338263.00	5872090.00	64592988.00	0.00	0.00	0.00	0.00	0.00	9705000.00	2325000.00	74267906.00	86297906.00	-21704918.00	-123452300.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
260	2	2024-11-12	131	0	0	128	256	98.00	396248.00	387174.00	50492497.00	227273.00	50719770.00	8553719.00	247934.00	20661.00	0.00	0.00	8822314.00	0.00	59542084.00	5954208.00	6549629.00	72045921.00	0.00	0.00	0.00	25000.00	3650000.00	3225000.00	3730000.00	22176005.00	32806005.00	39239916.00	-84212384.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
275	2	2024-11-27	131	0	0	73	146	56.00	347368.00	193571.00	25357834.00	0.00	25357834.00	4165289.00	214876.00	394216.00	0.00	0.00	4774381.00	0.00	30132215.00	3013221.00	3314544.00	36459980.00	0.00	0.00	0.00	100000.00	550000.00	550000.00	2400000.00	23382380.00	26982380.00	9477600.00	-115748896.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
276	2	2024-11-28	131	0	0	131	263	100.00	382901.00	382901.00	49746856.00	413223.00	50160079.00	8107438.00	169421.00	70248.00	0.00	0.00	8347107.00	0.00	58507186.00	5850719.00	6435791.00	70793696.00	0.00	0.00	1950000.00	0.00	18200000.00	4350000.00	2550000.00	19382762.00	46432762.00	24360934.00	-91387962.00	2025-12-25 20:33:24.701093+07	2025-12-26 04:58:04.790236+07	t
\.


--
-- TOC entry 5385 (class 0 OID 34605)
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
-- TOC entry 5396 (class 0 OID 34702)
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
-- TOC entry 5418 (class 0 OID 35322)
-- Dependencies: 264
-- Data for Name: audit_agendas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_agendas (id, date, hotel_id, auditor, status, notes, created_at, updated_at) FROM stdin;
1	2025-12-13	2	Asep	on_progress	Periksa dokumen	2025-12-19 05:37:42.972938+07	2025-12-19 06:12:51.966319+07
\.


--
-- TOC entry 5420 (class 0 OID 35350)
-- Dependencies: 266
-- Data for Name: audit_checklist_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_checklist_categories (id, name, "position", created_at, updated_at) FROM stdin;
1	Dokumen Income Audit	0	2025-12-19 06:05:18.149896+07	2025-12-19 06:05:18.149896+07
\.


--
-- TOC entry 5422 (class 0 OID 35363)
-- Dependencies: 268
-- Data for Name: audit_checklist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_checklist_items (id, category_id, name, standard, "position", is_active, created_at, updated_at) FROM stdin;
1	1	Daily Sales Report	Apakah DSR sesuai dengan Guest Account Balance	0	t	2025-12-19 06:07:06.391029+07	2025-12-19 06:08:56.61476+07
2	1	Jurnal Income	Apakah jurnal income audit sudah sesuai dan ditanda tangani	0	t	2025-12-19 06:09:53.383039+07	2025-12-19 06:09:53.383039+07
\.


--
-- TOC entry 5424 (class 0 OID 35390)
-- Dependencies: 270
-- Data for Name: audit_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_results (id, agenda_id, item_id, result, notes, image_url, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5372 (class 0 OID 34425)
-- Dependencies: 218
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, title, file_paths, thumbnail_url, created_at, hotel_id) FROM stdin;
6	Budget 2026 Golden Flower	["pdfFiles-1766213067006-18353380.pdf", "pdfFiles-1766213067013-712935797.pdf", "pdfFiles-1766213067015-887553968.pdf", "pdfFiles-1766213067015-775108525.pdf", "pdfFiles-1766213067020-523027733.pdf", "pdfFiles-1766213067027-851042462.pdf", "pdfFiles-1766213067033-302264102.pdf", "pdfFiles-1766213067039-870580589.pdf", "pdfFiles-1766213067043-778041521.pdf"]	thumb-1766213067045.png	2025-12-20 13:44:27.047684+07	\N
\.


--
-- TOC entry 5381 (class 0 OID 34507)
-- Dependencies: 227
-- Data for Name: budget_dsr; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_dsr (id, hotel_id, date, room_available, room_ooo, room_com_and_hu, room_sold, number_of_guest, occp_r_sold_percent, arr, revpar, lodging_revenue, others_room_revenue, room_revenue, breakfast_revenue, restaurant_revenue, room_service, banquet_revenue, fnb_others_revenue, fnb_revenue, others_revenue, total_revenue, service, tax, gross_revenue, shared_payable, deposit_reservation, cash_fo, cash_outlet, bank_transfer, qris, credit_debit_card, city_ledger, total_settlement, gab, balance, created_at, updated_at, is_locked) FROM stdin;
39	2	2025-11-01	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
41	2	2025-11-02	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
43	2	2025-11-03	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
45	2	2025-11-04	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
9	2	2025-12-01	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	136449668.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
10	2	2025-12-02	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	204674502.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
11	2	2025-12-03	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	272899336.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
47	2	2025-11-05	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
49	2	2025-11-06	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
51	2	2025-11-07	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
53	2	2025-11-08	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
55	2	2025-11-09	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
57	2	2025-11-10	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
59	2	2025-11-11	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
61	2	2025-11-12	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
63	2	2025-11-13	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
65	2	2025-11-14	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
67	2	2025-11-15	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
69	2	2025-11-16	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
71	2	2025-11-17	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
73	2	2025-11-18	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
75	2	2025-11-19	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
77	2	2025-11-20	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
79	2	2025-11-21	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
81	2	2025-11-22	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
83	2	2025-11-23	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
85	2	2025-11-24	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
87	2	2025-11-25	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
89	2	2025-11-26	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
91	2	2025-11-27	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
93	2	2025-11-28	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
95	2	2025-11-29	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
97	2	2025-11-30	0	0	0	0	0	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	2025-12-25 21:44:18.271659+07	2025-12-25 21:44:18.271659+07	f
12	2	2025-12-04	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	341124170.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
13	2	2025-12-05	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	409349004.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
14	2	2025-12-06	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	477573838.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
15	2	2025-12-07	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	545798672.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
16	2	2025-12-08	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	614023506.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
17	2	2025-12-09	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	682248340.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
18	2	2025-12-10	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	750473174.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
19	2	2025-12-11	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	818698008.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
20	2	2025-12-12	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	886922842.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
21	2	2025-12-13	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	955147676.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
22	2	2025-12-14	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1023372510.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
23	2	2025-12-15	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1091597344.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
24	2	2025-12-16	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1159822178.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
25	2	2025-12-17	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1228047012.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
26	2	2025-12-18	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1296271846.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
27	2	2025-12-19	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1364496680.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
28	2	2025-12-20	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1432721514.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
29	2	2025-12-21	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1500946348.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
30	2	2025-12-22	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1569171182.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
31	2	2025-12-23	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1637396016.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
32	2	2025-12-24	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1705620850.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
33	2	2025-12-25	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1773845684.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
34	2	2025-12-26	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1842070518.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
35	2	2025-12-27	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1910295352.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
36	2	2025-12-28	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	1978520186.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
37	2	2025-12-29	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	2046745020.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
38	2	2025-12-30	131	0	0	121	181	92.00	461559.00	426325.00	54331464.00	1517145.00	55848609.00	6725634.00	415889.00	169386.00	5065316.00	0.00	12376225.00	0.00	68224834.00	0.00	0.00	68224834.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00	68224834.00	2114969854.00	2025-12-25 18:56:58.931472+07	2025-12-25 18:56:58.931472+07	f
\.


--
-- TOC entry 5379 (class 0 OID 34490)
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
-- TOC entry 5387 (class 0 OID 34622)
-- Dependencies: 233
-- Data for Name: dsr_opening_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dsr_opening_balances (id, hotel_id, effective_date, balance_value, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5416 (class 0 OID 35245)
-- Dependencies: 262
-- Data for Name: guest_review_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_review_settings (id, hotel_id, logo_url, header_text, subheader_text, promo_enabled, promo_title, promo_description, promo_image_url, created_at, updated_at) FROM stdin;
3	2	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnvqhsyaCGFTmhyDbqJ3VSbyoGw_hWeFWi9Q&s	Bagaimana Pengalaman Menginap Anda?	Kami sangat menghargai masukan Anda untuk menjadi lebih baik.	t	Discount Hari Senin - Kamis	Silahkan tunjukan promo ini ketika anda kembali di hotel kami 	https://pbs.twimg.com/media/Dq9u3DNVAAAM7il.jpg	2025-12-18 12:00:55.669361+07	2025-12-20 12:19:27.652292+07
\.


--
-- TOC entry 5412 (class 0 OID 35200)
-- Dependencies: 258
-- Data for Name: guest_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_reviews (id, hotel_id, guest_name, room_number, checkin_date, rating, cleanliness_rating, service_rating, facilities_rating, comment, status, created_at, updated_at, guest_email, reply_text, replied_at, voucher_number, voucher_used_at, voucher_used_by_guest, voucher_used_room_number, voucher_used_folio_number) FROM stdin;
13	2	Asep Suhendar	109	2025-12-03	5	4	5	5	Ada rambut di kasur	approved	2025-12-20 12:47:00.363951+07	2025-12-20 13:07:17.19936+07	asep3580@gmail.com	\N	\N	FBH-13251220	\N	\N	\N	\N
\.


--
-- TOC entry 5426 (class 0 OID 35518)
-- Dependencies: 272
-- Data for Name: hotel_competitor_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hotel_competitor_data (id, hotel_id, date, competitor_name, number_of_rooms, room_available, room_sold, occupancy_percent, arr, revpar, revenue, ari, rgi, mpi, rank_mpi, created_at, updated_at) FROM stdin;
1	2	2025-12-01	Feruci Braga Hotel	131	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	2025-12-20 07:32:32.830045+07	2025-12-20 15:18:05.15041+07
2	2	2025-12-01	Kimaya Hotel	193	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	2025-12-20 07:32:32.830045+07	2025-12-20 15:18:05.15041+07
3	2	2025-12-01	De Braga Hotel	112	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	2025-12-20 07:32:32.830045+07	2025-12-20 15:18:05.15041+07
4	2	2025-12-01	Grand Dafam Hotel	111	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	2025-12-20 07:32:32.830045+07	2025-12-20 15:18:05.15041+07
5	2	2025-12-01	Kedaton Hotel	110	\N	\N	\N	\N	\N	\N	\N	\N	\N	6	2025-12-20 07:32:32.830045+07	2025-12-20 15:18:05.15041+07
6	2	2025-12-01	El Royal Hotel	492	\N	\N	\N	\N	\N	\N	\N	\N	\N	7	2025-12-20 07:32:32.830045+07	2025-12-20 15:18:05.15041+07
\.


--
-- TOC entry 5428 (class 0 OID 35556)
-- Dependencies: 274
-- Data for Name: hotel_competitors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hotel_competitors (id, hotel_id, competitor_name, created_at, updated_at, number_of_rooms, display_order) FROM stdin;
12	2	Kimaya Hotel	2025-12-20 07:30:00.247876+07	2025-12-20 07:30:43.281674+07	193	2
11	2	De Braga Hotel	2025-12-20 07:29:45.977378+07	2025-12-20 07:30:43.281674+07	112	3
10	2	Grand Dafam Hotel	2025-12-20 07:29:28.641894+07	2025-12-20 07:30:43.281674+07	111	4
9	2	Kedaton Hotel	2025-12-20 07:29:13.883827+07	2025-12-20 07:30:43.281674+07	110	5
8	2	El Royal Hotel	2025-12-20 07:28:58.887518+07	2025-12-20 07:30:43.281674+07	492	6
13	2	Feruci Braga Hotel	2025-12-20 07:30:36.605735+07	2025-12-20 10:27:50.522248+07	131	1
\.


--
-- TOC entry 5376 (class 0 OID 34461)
-- Dependencies: 222
-- Data for Name: hotels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hotels (id, name, created_at, updated_at, address, brand, city, thumbnail_url, number_of_rooms) FROM stdin;
1	Golden Flower Hotel	2025-12-14 16:03:34.967876+07	2025-12-14 18:34:14.050842+07	Jl. Asia Afrika No.15-17, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111	Unique	Bandung	\N	\N
4	Grand Serela Setiabudhi Hotel	2025-12-14 18:32:05.204941+07	2025-12-14 18:34:34.436635+07	Jl. Hegarmanah No.15 No. 9, Hegarmanah, Cidadap, Bandung City, West Java 12630	Unique	Bandung	\N	\N
5	Grand Serela Yogyakarta Hotel	2025-12-14 18:36:06.298849+07	2025-12-14 18:36:06.298849+07	Jl. Magelang KM 4 No.145 Sleman Yogyakarta 55284 Indonesia,	Unique	Yogyakarta	\N	\N
6	Gino Villa Ubud	2025-12-14 18:40:35.401969+07	2025-12-14 18:40:35.401969+07	F756+QFP, Jalan A A Gede Rai, Banjar Tengah, Lodtunduh, Gianyar Regency, Bali 80571	Unique	Bali	\N	\N
7	Gino Feruci Cianjur Hotel	2025-12-14 18:41:28.349778+07	2025-12-14 18:41:28.349778+07	Jl. KH Abdullah Bin Nuh No.46, Pamoyanan, Kec. Cianjur, Kabupaten Cianjur, Jawa Barat 43211	Unique	Cianjur	\N	\N
9	Serela Riau Hotel	2025-12-14 18:43:21.358846+07	2025-12-14 18:43:21.358846+07	LLRE Martadinata St No.56, Citarum, Bandung Wetan, Bandung City, West Java 40115	Serela	Bandung	\N	\N
8	Serela Cihampelas Hotel	2025-12-14 18:42:21.739315+07	2025-12-14 18:43:30.336335+07	Jl. Cihampelas No.147, Cipaganti, Kecamatan Coblong, Kota Bandung, Jawa Barat 40131	Serela	Bandung	\N	\N
10	Serela Merdeka Hotel	2025-12-14 18:44:18.126623+07	2025-12-14 18:44:18.126623+07	Jl. Purnawarman No.23, Tamansari, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40116	Serela	Bandung	\N	\N
11	Serela Waringin Hotel	2025-12-14 18:44:58.311091+07	2025-12-14 18:44:58.311091+07	Jl. Kelenteng No.30-33, Ciroyom, Kec. Andir, Kota Bandung, Jawa Barat 40181	Serela	Bandung	\N	\N
12	Serela Kuta Hotel	2025-12-14 18:45:33.721977+07	2025-12-14 18:45:33.721977+07	No Jl. Raya Kuta, Kuta, Kec. Kuta, Kabupaten Badung, Bali 80361	Serela	Bali	\N	\N
13	Zodiak Asia Afrika Hotel	2025-12-14 18:47:09.077322+07	2025-12-14 18:47:09.077322+07	Jl. Asia Afrika No.34, Balonggede, Kec. Regol, Kota Bandung, Jawa Barat 40251	Zodiak	Bandung	\N	\N
14	Zodiak Kebon Kawung Hotel	2025-12-14 18:47:44.21034+07	2025-12-14 18:47:44.21034+07	Jl. Kebon Kawung No.54, Bandung, Jawa Barat, Kota Bandung, Jawa Barat 40171	Zodiak	Bandung	\N	\N
15	Zodiak Kebonjati Hotel	2025-12-14 18:48:23.034375+07	2025-12-14 18:48:23.034375+07	Jl. Kebon Jati No.34, Kb. Jeruk, Kec. Andir, Kota Bandung, Jawa Barat 40181	Zodiak	Bandung	\N	\N
3	Opera White Hotel	2025-12-14 18:31:10.063492+07	2025-12-14 18:48:47.744215+07	Jl. Kebon Jati No.71-75, Kb. Jeruk, Kec. Andir, Kota Bandung, Jawa Barat 40171	Unique	Bandung	\N	\N
16	Zodiak Sutami Hotel	2025-12-14 18:49:24.577949+07	2025-12-14 18:49:24.577949+07	Jl. Prof. Dr. Sutami No.97, Sukarasa, Kec. Sukasari, Kota Bandung, Jawa Barat 40163	Zodiak	Bandung	\N	\N
17	Zodiak Paskal Hotel	2025-12-14 18:50:03.191664+07	2025-12-14 18:50:03.191664+07	Jl. Pasir Kaliki No.50, Pasir Kaliki, Kec. Cicendo, Kota Bandung, Jawa Barat 40171	Zodiak	Bandung	\N	\N
18	Zodiak MT Haryono Hotel	2025-12-14 18:51:03.224243+07	2025-12-14 18:51:03.224243+07	Jl. Otista Raya No.60 11, RT.11/RW.12, Bidara Cina, Kecamatan Jatinegara, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13330	Zodiak	Jakarta	\N	\N
19	Parlezo Hotel	2025-12-14 18:52:12.137134+07	2025-12-14 18:52:12.137134+07	GV6M+282, Labuan Bajo, Komodo, West Manggarai Regency, East Nusa Tenggara	Serela	Labuan Bajo NTT	\N	\N
20	The Naripan Hotel	2025-12-14 18:52:53.100867+07	2025-12-14 18:52:53.100867+07	Jl. Naripan No.31-35, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111	Serela	Bandung	\N	\N
2	Feruci Braga Hotel	2025-12-14 18:30:03.507909+07	2025-12-25 10:21:12.310258+07	Jl. Braga No.67, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111	Unique	Bandung	\N	\N
\.


--
-- TOC entry 5402 (class 0 OID 34753)
-- Dependencies: 248
-- Data for Name: inspection_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_items (id, inspection_type_id, category, name, standard, "position", created_at, updated_at) FROM stdin;
757	1	Kebersihan	Lantai bersih dan tidak berdebu	Lantai harus disapu dan dipel, bebas dari kotoran dan debu.	1	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
758	1	Kebersihan	Jendela dan cermin bersih	Tidak ada noda, sidik jari, atau debu pada permukaan kaca.	2	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
759	1	Kebersihan	Tempat tidur rapi dan sprei bersih	Sprei dan bed cover terpasang kencang, rapi, dan tidak ada noda.	3	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
760	1	Kebersihan	Tidak ada sarang laba-laba	Periksa seluruh sudut ruangan, langit-langit, dan di balik perabotan.	4	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
761	1	Fasilitas Kamar	AC berfungsi dengan baik	AC menyala, suhu bisa diatur, dan tidak mengeluarkan suara bising.	1	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
762	1	Fasilitas Kamar	TV berfungsi dan remote tersedia	TV menyala, semua channel berfungsi, remote ada dan berfungsi.	2	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
763	1	Fasilitas Kamar	Semua lampu berfungsi	Periksa semua lampu di kamar dan kamar mandi.	3	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
764	1	Kamar Mandi	Toilet bersih dan higienis	Toilet bowl, seat, dan area sekitar bersih dan sudah disanitasi.	1	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
765	1	Kamar Mandi	Shower berfungsi (air panas & dingin)	Aliran air lancar untuk panas dan dingin.	2	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
766	1	Kamar Mandi	Handuk bersih dan lengkap	Tersedia handuk sesuai standar jumlah dan dalam kondisi bersih.	3	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
767	2	Lobi	Kebersihan lantai lobi	Lantai lobi bersih, kering, dan tidak licin.	1	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
768	2	Lobi	Kerapian sofa dan meja	Sofa dan meja tertata rapi, bebas dari debu dan sampah.	2	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
769	2	Koridor	Penerangan koridor cukup	Semua lampu koridor menyala dan tidak ada yang redup atau mati.	1	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
770	2	Koridor	Tidak ada barang penghalang	Koridor bebas dari troli, sampah, atau barang lain yang menghalangi jalan.	2	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
771	3	Kebersihan Peralatan	Kompor dan oven bersih	Bebas dari sisa makanan, minyak, dan kerak.	1	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
772	3	Kebersihan Peralatan	Kulkas dan Freezer bersih	Bersih dari tumpahan, tidak berbau, dan suhu sesuai standar.	2	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
773	3	Penyimpanan Makanan	Penerapan sistem FIFO	Bahan makanan lama berada di depan untuk digunakan lebih dulu.	1	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
774	3	Keamanan	Tabung pemadam api (APAR) tersedia	APAR berada di lokasi yang mudah dijangkau dan belum kedaluwarsa.	1	2025-12-26 07:02:02.04774+07	2025-12-26 07:02:02.04774+07
\.


--
-- TOC entry 5406 (class 0 OID 34801)
-- Dependencies: 252
-- Data for Name: inspection_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_results (id, inspection_id, item_id, result, notes, image_url, priority) FROM stdin;
\.


--
-- TOC entry 5408 (class 0 OID 34840)
-- Dependencies: 254
-- Data for Name: inspection_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_tasks (id, inspection_id, item_id, hotel_id, description, notes, status, priority, assigned_to, due_date, completion_photo_url, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5400 (class 0 OID 34741)
-- Dependencies: 246
-- Data for Name: inspection_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspection_types (id, name, created_at, updated_at) FROM stdin;
1	Inspeksi Kamar	2025-12-14 15:57:50.209381+07	2025-12-26 07:02:02.04774+07
2	Inspeksi Area Publik	2025-12-14 15:57:50.209381+07	2025-12-26 07:02:02.04774+07
3	Inspeksi Dapur	2025-12-14 15:57:50.209381+07	2025-12-26 07:02:02.04774+07
\.


--
-- TOC entry 5404 (class 0 OID 34778)
-- Dependencies: 250
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspections (id, hotel_id, inspection_type_id, room_number_or_area, inspection_date, status, score, created_at, updated_at, pic_name, inspector_id, notes, inspector_name) FROM stdin;
\.


--
-- TOC entry 5393 (class 0 OID 34676)
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
113	submenu:input_hotel_competitor	Menu Access	Akses submenu Input Hotel Competitor
142	financials:competitor:manage	Financials	Bisa input data hotel competitor
185	submenu:guest_review_vouchers	Menu Access	Akses submenu Penggunaan Voucher
212	submenu:trial_balance	Menu Access	Akses submenu Trial Balance
\.


--
-- TOC entry 5414 (class 0 OID 35221)
-- Dependencies: 260
-- Data for Name: review_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review_media (id, review_id, file_path, media_type, created_at) FROM stdin;
\.


--
-- TOC entry 5394 (class 0 OID 34686)
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
7	51
7	52
7	53
7	54
2	113
2	142
1	113
1	142
1	185
7	185
8	8
8	9
8	10
8	11
8	12
8	113
1	212
2	212
3	97
3	98
3	99
3	100
3	142
3	1
3	2
3	4
3	5
3	6
3	7
3	8
3	9
3	10
3	11
3	12
3	13
3	14
3	19
3	49
3	50
3	55
3	113
3	212
\.


--
-- TOC entry 5391 (class 0 OID 34662)
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
7	e-commerce	Akses hanya ke fitur Guest Review.	2025-12-20 05:50:04.785395+07	2025-12-20 05:50:04.785395+07
8	night_audit	Akses ke menu Daily Income dan submenunya berdasarkan hotel.	2025-12-20 13:41:55.77116+07	2025-12-20 13:41:55.77116+07
\.


--
-- TOC entry 5389 (class 0 OID 34639)
-- Dependencies: 235
-- Data for Name: room_production; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.room_production (id, hotel_id, date, segment, company, room, guest, arr, lodging_revenue, pic_name, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5398 (class 0 OID 34723)
-- Dependencies: 244
-- Data for Name: slides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.slides (id, hotel_id, title, link, thumbnail_url, "position", created_at, updated_at) FROM stdin;
28	3	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1skQwiO3azAHlGWTp6sFw0QFCJn89yl7TK_IRnipnrVU/edit?slide=id.p#slide=id.p	https://q-xx.bstatic.com/xdata/images/hotel/max500/181769144.jpg?k=935e5cd34b348bf5946f8f6e033d7876bb18284921a98505a0482e10dfcfbadb&o=	18	2025-12-24 10:22:46.084205+07	2025-12-24 10:23:59.238028+07
21	17	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1fyJ9EobzlMnOeyKoOuDHDF20YYY5uH8D5hJjnxdGkh4/edit?slide=id.p#slide=id.p	https://q-xx.bstatic.com/xdata/images/hotel/max500/30758863.jpg?k=1fc789e125ae21ac888d47323a20e84e188f84121acb03de369e386eaff03d59&o=	10	2025-12-14 19:08:21.66419+07	2025-12-24 10:30:18.383405+07
22	16	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1F5IAjc61BlvM64NLEHQEQqDyqZ1SJHQy4AwYwhkgRUQ/edit?slide=id.p#slide=id.p	https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-mobile/tix-hotel/images-web/2025/05/19/ff227716-a1f2-4a9e-b392-c0020f09d1e8-1747623428360-193950e2da247d17a3b93c61becb4566.jpg	12	2025-12-14 19:09:35.340379+07	2025-12-24 10:30:42.307515+07
23	15	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1nX157L19lpTDJNPD0wxcYoYlJfxPDjIF1GJI1NNDO1Y/edit?slide=id.p#slide=id.p	https://pix10.agoda.net/hotelImages/551/551929/551929_16083011170045910927.jpg?ca=6&ce=1&s=414x232	13	2025-12-14 19:11:19.281181+07	2025-12-24 10:31:01.556617+07
24	18	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1IUjbB6p-cs-SEkDm621qz_AV4g_M_zTyIlNsZrUTN8s/edit?slide=id.p#slide=id.p	https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/t_htl-dskt/tix-hotel/images-web/2020/10/31/e4fee307-e26f-47e5-baf6-4093b323bcb7-1604139122507-73c28690eddf1f80e572dea1adc5421f.jpg	16	2025-12-14 19:12:13.146918+07	2025-12-24 10:31:40.50849+07
8	\N	Summary Jan-Dec 2025	https://docs.google.com/presentation/d/1r_wpDO2ls3dQpFd0QZ52g7IdqEDdxkyywTgtqDzLJ9g/edit?slide=id.p1#slide=id.p1	https://img.freepik.com/psd-premium/garis-grafik-3d-di-latar-belakang-transparan_1195761-15731.jpg?w=360	1	2025-12-14 18:17:09.938271+07	2025-12-24 10:32:27.091724+07
10	\N	PT PNH Report Dec 2025	https://docs.google.com/presentation/d/15JZxXoOD0L1KPNW-340uqCVyV9hOieKchXMK3dMmWBI/edit?slide=id.p1#slide=id.p1	https://img.freepik.com/psd-gratis/templat-infografis-bisnis-5-langkah_47987-13875.jpg?semt=ais_se_enriched&w=740&q=80	2	2025-12-14 18:20:03.106132+07	2025-12-24 10:32:54.286648+07
9	\N	Hotel Report Dec 2025	https://docs.google.com/presentation/d/1kenRIbJX5B4oPKoWgKHsAARkCLd_CkXHD_s0-nsJTHE/edit?slide=id.p1#slide=id.p1	https://crisissupportsolutions.com/wp-content/uploads/2013/08/stats-pie-chart-bar-graph.jpg	3	2025-12-14 18:18:54.849992+07	2025-12-24 10:33:08.415674+07
16	9	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1toJ00YZM2vgxuyBImn54DPzoLDiWn9gd08KiFtOINb0/edit?slide=id.p#slide=id.p	https://pbs.twimg.com/profile_images/459514844492754944/TTOq9Fhk_400x400.jpeg	15	2025-12-14 19:02:40.04383+07	2025-12-24 10:31:29.725212+07
25	20	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1udWYWSpQgJHZBA_nVrkNA6F036atBT9uiR-rXdB2qKM/edit?slide=id.p#slide=id.p	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3dBq6DUH-Y2Bpl42WheQn2mjnBRazIDg-GQ&s	17	2025-12-14 19:13:44.26518+07	2025-12-24 10:31:55.288825+07
11	2	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1RcMjri2_UxLJC8TS757AHOGjwCekcOrgDpbtNBcNWdo/edit?slide=id.p#slide=id.p	https://newsletter.kagumhotels.com/wp-content/uploads/2025/03/image-23-960x1000.png	2	2025-12-14 18:54:32.481137+07	2025-12-23 16:47:55.539788+07
29	1	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1xfl6-6LrAdPbmoCG0oJTBg_OK0fhx0sRnHVEA9QEJRs/edit?slide=id.p#slide=id.p	https://cf.bstatic.com/xdata/images/hotel/max1024x768/14322960.jpg?k=4cbec7d7e4cccef3bc4aa39bdc5b86dbf3e684d7520fbcad945b40a8478c93fa&o=	19	2025-12-24 10:28:14.795812+07	2025-12-24 10:28:28.002647+07
18	10	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1B48nwEMiCx91cqiK-fayRkACUhV3wGGVcbQeFZEz4n8/edit?slide=id.p#slide=id.p	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/04/c0/b0/b6/hotel-serela-merdeka.jpg?w=900&h=500&s=1	3	2025-12-14 19:05:03.492296+07	2025-12-24 10:28:44.992175+07
13	4	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1MdcMvQJ0sBUSyyh9_Xk-rGGfEhC1U-Fmg3ca6J7qDhs/edit?slide=id.p#slide=id.p	https://q-xx.bstatic.com/xdata/images/hotel/max500/20917113.jpg?k=c6923887c5ed9918cdec91e7bbbce2158ed6f39e751c50f6502bf26ae9f407ff&o=	4	2025-12-14 18:56:58.989201+07	2025-12-24 10:28:56.05407+07
14	6	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1Zm1B04pzxwopf9qpsbadVLfb_wijx5Hng-5bTnlff-w/edit?slide=id.p#slide=id.p	https://ik.imagekit.io/tvlk/apr-asset/dgXfoyh24ryQLRcGq00cIdKHRmotrWLNlvG-TxlcLxGkiDwaUSggleJNPRgIHCX6/hotel/asset/10000122-1500x1001-FIT_AND_TRIM-d52e589b9fb8944e5fd8db97c963ba01.jpeg?tr=q-80,c-at_max,w-740,h-500&_src=imagekit	5	2025-12-14 18:59:02.511677+07	2025-12-24 10:29:07.827479+07
17	11	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1lfinvs5W3E83pJsIS8qeOhCmNGwStEmah8CHuK_znqg/edit?slide=id.p#slide=id.p	https://pix10.agoda.net/hotelImages/648/648807/648807_16092018170046686550.jpg?ca=6&ce=1&s=414x232	6	2025-12-14 19:03:37.136848+07	2025-12-24 10:29:19.181315+07
19	12	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1_8BoF7fv85oX6Ck74dGGF-WIg5kEX-LYs1fgzCw98hc/edit?slide=id.p#slide=id.p	https://pix10.agoda.net/hotelImages/281/281587/281587_15070213590031558561.jpg?ca=4&ce=1&s=414x232	7	2025-12-14 19:06:03.565672+07	2025-12-24 10:29:32.114945+07
15	8	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/18OialgNZADHp2pmlJW5oq-fT6hq3lUFdz9EbxePsfxM/edit?slide=id.p#slide=id.p	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/06/cf/0e/64/serela-cihampelas.jpg?w=900&h=500&s=1	11	2025-12-14 19:00:08.388966+07	2025-12-24 10:30:30.933917+07
26	19	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1zrEabG9YVAIKU6RKBtoxkXbI-t3RBLqWLoWhqXowWVk/edit?slide=id.p#slide=id.p	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/27/50/18/fb/facade.jpg?w=900&h=500&s=1	14	2025-12-14 19:14:43.069122+07	2025-12-24 10:31:17.629054+07
27	14	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/19QTPBukuUceUkUki_RY2VS5EERyXKxghpVQvWxfhXZM/edit?slide=id.p#slide=id.p	https://pix10.agoda.net/hotelImages/621268/0/361b60999705ec9bb4c27fd9f095dd8a.jpeg?ce=0&s=414x232	8	2025-12-14 19:16:28.84993+07	2025-12-24 10:29:44.529166+07
20	13	Profit (loss) Dec 2025	https://docs.google.com/presentation/d/1dql5QK1hZB-BCz5z_HTEoddesocVYtfgyuZR2vC-eO8/edit?slide=id.p#slide=id.p	https://www.bandunghotels.net/data/Pics/OriginalPhoto/15845/1584551/1584551973/pic-zodiak-asia-afrika-by-kagum-hotels-bandung-1.JPEG	9	2025-12-14 19:07:10.771981+07	2025-12-24 10:29:56.97566+07
\.


--
-- TOC entry 5410 (class 0 OID 35124)
-- Dependencies: 256
-- Data for Name: trial_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trial_balances (id, title, link, status, created_at, updated_at, thumbnail_url, "position", drive_folder_link) FROM stdin;
6	Trial Balance - Serela Riau Hotel	https://docs.google.com/spreadsheets/d/1ReBj1nUMcMRtulkKIef4w1qReFh5NtcLg2699CTeFsA/edit?gid=1048484551#gid=1048484551	closed	2025-12-18 05:32:39.536027+07	2025-12-23 16:17:23.219382+07	https://cf.bstatic.com/xdata/images/hotel/max500/81922714.jpg?k=2c8559234f736c6b4834686cdd8eb05a32edd92becc7c952f063205aab05381e&o=&hp=1	5	\N
4	Trial Balance - Vismaya Ubud	https://docs.google.com/spreadsheets/d/1_R1R29_NbEUWv2lhjFfyqDsM_6gfj07rHM-wG6BvOZs/edit?gid=732429151#gid=732429151	in_audit	2025-12-18 05:28:23.611793+07	2025-12-23 16:17:30.528222+07	https://ik.imagekit.io/tvlk/apr-asset/dgXfoyh24ryQLRcGq00cIdKHRmotrWLNlvG-TxlcLxGkiDwaUSggleJNPRgIHCX6/hotel/asset/10000122-1500x1001-FIT_AND_TRIM-d52e589b9fb8944e5fd8db97c963ba01.jpeg?tr=q-80,c-at_max,w-740,h-500&_src=imagekit	1	\N
3	Trial Balance - White Opera Hotel	https://docs.google.com/spreadsheets/d/1qfuegFl8Vzex0RbDFcZwPs2mUxDAjfWuYlCxYzi85fg/edit?gid=0#gid=0	closed	2025-12-18 05:25:21.726488+07	2025-12-25 09:44:51.001729+07	https://q-xx.bstatic.com/xdata/images/hotel/max500/181769144.jpg?k=935e5cd34b348bf5946f8f6e033d7876bb18284921a98505a0482e10dfcfbadb&o=	2	\N
2	Trial Balance - Feruci Braga Hotel	https://docs.google.com/spreadsheets/d/1apIBoRuFOvAnvsplpaUiOqXtXVVW7SKXsZsqxhbJA2g/edit?gid=927072881#gid=927072881	closed	2025-12-18 05:13:46.265629+07	2025-12-18 06:34:04.004909+07	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQveFRm4ltoCfzFmid-sfEdVYNesr7io26-Vw&s	3	\N
1	Trial Balance - Golden Flower Hotel	https://docs.google.com/spreadsheets/d/1QKwiaJG5bk2vI9kp8OYbIGCs0f1QoUS8x2_CTKbBulY/edit?gid=239012900#gid=239012900	in_audit	2025-12-18 04:55:09.622465+07	2025-12-18 06:34:04.004909+07	https://cf.bstatic.com/xdata/images/hotel/max1024x768/14322960.jpg?k=4cbec7d7e4cccef3bc4aa39bdc5b86dbf3e684d7520fbcad945b40a8478c93fa&o=	4	\N
5	Trial Balance - Grand Serela Setiabudhi Hotel	https://docs.google.com/spreadsheets/d/1e38pAZlIhxm7TUpKz6ITTB2L1eK29O4cBqxeWdZTOPI/edit?gid=2037499852#gid=2037499852	closed	2025-12-18 05:30:28.643383+07	2025-12-18 15:00:14.410213+07	https://q-xx.bstatic.com/xdata/images/hotel/max500/20917113.jpg?k=c6923887c5ed9918cdec91e7bbbce2158ed6f39e751c50f6502bf26ae9f407ff&o=	0	https://drive.google.com/drive/folders/1BtQCqgIVWqBIEJTrhAMjdUEEdHA78eY9?usp=sharing
7	Trial Balance - Serela Merdeka	https://docs.google.com/spreadsheets/d/1jsQ3BkhFrhLoba3o7grxJgRIoajBD7__sE3YTc5aQq4/edit?gid=565464522#gid=565464522&range=A1	closed	2025-12-22 09:43:21.121643+07	2025-12-23 16:17:12.128719+07	https://dynamic-media-cdn.tripadvisor.com/media/photo-o/04/c0/b0/b6/hotel-serela-merdeka.jpg?w=900&h=500&s=1	\N	https://drive.google.com/drive/folders/1uHMp-DIKhNHKrO0VOK6b_RF-3iscIxsp
\.


--
-- TOC entry 5377 (class 0 OID 34474)
-- Dependencies: 223
-- Data for Name: user_hotel_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_hotel_access (user_id, hotel_id) FROM stdin;
11	2
\.


--
-- TOC entry 5374 (class 0 OID 34446)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, full_name, role, hotel_id, created_at, reset_password_token, reset_password_expires) FROM stdin;
1	admin	stealth3580@gmail.com	$2b$10$2eo6qyrz/kuvS28RHbaHQ.dDWcq1Urp4Vf7N/z.Y/hC2OTRMEVWOu	Admin Utama	admin	\N	2025-12-14 15:59:13.293154+07	080c691c679d8eb4e7800e9f2bfa1b60ce281f4882d8a4205a4900ce5d7f63c1	2025-12-20 06:17:19.107+07
11	asep	asep3580@gmail.com	$2b$10$8oU7l4cLgDxao/LTxtI/qu7pdpBOkOD58Olv6tpC4oYFrs.woUdLK	Asep Suhendar	staff	\N	2025-12-25 09:22:47.048808+07	\N	\N
\.


--
-- TOC entry 5462 (class 0 OID 0)
-- Dependencies: 228
-- Name: actual_dsr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actual_dsr_id_seq', 956, true);


--
-- TOC entry 5463 (class 0 OID 0)
-- Dependencies: 230
-- Name: actuals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actuals_id_seq', 84, true);


--
-- TOC entry 5464 (class 0 OID 0)
-- Dependencies: 241
-- Name: ar_aging_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ar_aging_id_seq', 60, true);


--
-- TOC entry 5465 (class 0 OID 0)
-- Dependencies: 263
-- Name: audit_agendas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_agendas_id_seq', 1, true);


--
-- TOC entry 5466 (class 0 OID 0)
-- Dependencies: 265
-- Name: audit_checklist_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_checklist_categories_id_seq', 1, true);


--
-- TOC entry 5467 (class 0 OID 0)
-- Dependencies: 267
-- Name: audit_checklist_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_checklist_items_id_seq', 2, true);


--
-- TOC entry 5468 (class 0 OID 0)
-- Dependencies: 269
-- Name: audit_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_results_id_seq', 1, false);


--
-- TOC entry 5469 (class 0 OID 0)
-- Dependencies: 217
-- Name: books_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.books_id_seq', 6, true);


--
-- TOC entry 5470 (class 0 OID 0)
-- Dependencies: 226
-- Name: budget_dsr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_dsr_id_seq', 98, true);


--
-- TOC entry 5471 (class 0 OID 0)
-- Dependencies: 224
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budgets_id_seq', 105, true);


--
-- TOC entry 5472 (class 0 OID 0)
-- Dependencies: 232
-- Name: dsr_opening_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dsr_opening_balances_id_seq', 1, false);


--
-- TOC entry 5473 (class 0 OID 0)
-- Dependencies: 261
-- Name: guest_review_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guest_review_settings_id_seq', 14, true);


--
-- TOC entry 5474 (class 0 OID 0)
-- Dependencies: 257
-- Name: guest_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guest_reviews_id_seq', 14, true);


--
-- TOC entry 5475 (class 0 OID 0)
-- Dependencies: 271
-- Name: hotel_competitor_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hotel_competitor_data_id_seq', 42, true);


--
-- TOC entry 5476 (class 0 OID 0)
-- Dependencies: 273
-- Name: hotel_competitors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hotel_competitors_id_seq', 13, true);


--
-- TOC entry 5477 (class 0 OID 0)
-- Dependencies: 221
-- Name: hotels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hotels_id_seq', 20, true);


--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 247
-- Name: inspection_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspection_items_id_seq', 774, true);


--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 251
-- Name: inspection_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspection_results_id_seq', 33, true);


--
-- TOC entry 5480 (class 0 OID 0)
-- Dependencies: 253
-- Name: inspection_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspection_tasks_id_seq', 3, true);


--
-- TOC entry 5481 (class 0 OID 0)
-- Dependencies: 245
-- Name: inspection_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspection_types_id_seq', 3, true);


--
-- TOC entry 5482 (class 0 OID 0)
-- Dependencies: 249
-- Name: inspections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspections_id_seq', 13, true);


--
-- TOC entry 5483 (class 0 OID 0)
-- Dependencies: 238
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 212, true);


--
-- TOC entry 5484 (class 0 OID 0)
-- Dependencies: 259
-- Name: review_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_media_id_seq', 6, true);


--
-- TOC entry 5485 (class 0 OID 0)
-- Dependencies: 236
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- TOC entry 5486 (class 0 OID 0)
-- Dependencies: 234
-- Name: room_production_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.room_production_id_seq', 1, false);


--
-- TOC entry 5487 (class 0 OID 0)
-- Dependencies: 243
-- Name: slides_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.slides_id_seq', 29, true);


--
-- TOC entry 5488 (class 0 OID 0)
-- Dependencies: 255
-- Name: trial_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trial_balances_id_seq', 7, true);


--
-- TOC entry 5489 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- TOC entry 5105 (class 2606 OID 34598)
-- Name: actual_dsr actual_dsr_hotel_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_dsr
    ADD CONSTRAINT actual_dsr_hotel_id_date_key UNIQUE (hotel_id, date);


--
-- TOC entry 5107 (class 2606 OID 34596)
-- Name: actual_dsr actual_dsr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_dsr
    ADD CONSTRAINT actual_dsr_pkey PRIMARY KEY (id);


--
-- TOC entry 5109 (class 2606 OID 34615)
-- Name: actuals actuals_hotel_id_year_account_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actuals
    ADD CONSTRAINT actuals_hotel_id_year_account_code_key UNIQUE (hotel_id, year, account_code);


--
-- TOC entry 5111 (class 2606 OID 34613)
-- Name: actuals actuals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actuals
    ADD CONSTRAINT actuals_pkey PRIMARY KEY (id);


--
-- TOC entry 5131 (class 2606 OID 34716)
-- Name: ar_aging ar_aging_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ar_aging
    ADD CONSTRAINT ar_aging_pkey PRIMARY KEY (id);


--
-- TOC entry 5161 (class 2606 OID 35332)
-- Name: audit_agendas audit_agendas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_agendas
    ADD CONSTRAINT audit_agendas_pkey PRIMARY KEY (id);


--
-- TOC entry 5163 (class 2606 OID 35360)
-- Name: audit_checklist_categories audit_checklist_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_categories
    ADD CONSTRAINT audit_checklist_categories_name_key UNIQUE (name);


--
-- TOC entry 5165 (class 2606 OID 35358)
-- Name: audit_checklist_categories audit_checklist_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_categories
    ADD CONSTRAINT audit_checklist_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5167 (class 2606 OID 35374)
-- Name: audit_checklist_items audit_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_items
    ADD CONSTRAINT audit_checklist_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5169 (class 2606 OID 35401)
-- Name: audit_results audit_results_agenda_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results
    ADD CONSTRAINT audit_results_agenda_id_item_id_key UNIQUE (agenda_id, item_id);


--
-- TOC entry 5171 (class 2606 OID 35399)
-- Name: audit_results audit_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results
    ADD CONSTRAINT audit_results_pkey PRIMARY KEY (id);


--
-- TOC entry 5083 (class 2606 OID 34433)
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- TOC entry 5101 (class 2606 OID 34549)
-- Name: budget_dsr budget_dsr_hotel_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_dsr
    ADD CONSTRAINT budget_dsr_hotel_id_date_key UNIQUE (hotel_id, date);


--
-- TOC entry 5103 (class 2606 OID 34547)
-- Name: budget_dsr budget_dsr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_dsr
    ADD CONSTRAINT budget_dsr_pkey PRIMARY KEY (id);


--
-- TOC entry 5097 (class 2606 OID 34500)
-- Name: budgets budgets_hotel_id_year_account_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_hotel_id_year_account_code_key UNIQUE (hotel_id, year, account_code);


--
-- TOC entry 5099 (class 2606 OID 34498)
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- TOC entry 5113 (class 2606 OID 34632)
-- Name: dsr_opening_balances dsr_opening_balances_hotel_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dsr_opening_balances
    ADD CONSTRAINT dsr_opening_balances_hotel_id_key UNIQUE (hotel_id);


--
-- TOC entry 5115 (class 2606 OID 34630)
-- Name: dsr_opening_balances dsr_opening_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dsr_opening_balances
    ADD CONSTRAINT dsr_opening_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 5157 (class 2606 OID 35259)
-- Name: guest_review_settings guest_review_settings_hotel_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_review_settings
    ADD CONSTRAINT guest_review_settings_hotel_id_key UNIQUE (hotel_id);


--
-- TOC entry 5159 (class 2606 OID 35257)
-- Name: guest_review_settings guest_review_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_review_settings
    ADD CONSTRAINT guest_review_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5153 (class 2606 OID 35214)
-- Name: guest_reviews guest_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_reviews
    ADD CONSTRAINT guest_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5173 (class 2606 OID 35527)
-- Name: hotel_competitor_data hotel_competitor_data_hotel_id_date_competitor_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_competitor_data
    ADD CONSTRAINT hotel_competitor_data_hotel_id_date_competitor_name_key UNIQUE (hotel_id, date, competitor_name);


--
-- TOC entry 5175 (class 2606 OID 35525)
-- Name: hotel_competitor_data hotel_competitor_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_competitor_data
    ADD CONSTRAINT hotel_competitor_data_pkey PRIMARY KEY (id);


--
-- TOC entry 5177 (class 2606 OID 35565)
-- Name: hotel_competitors hotel_competitors_hotel_id_competitor_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_competitors
    ADD CONSTRAINT hotel_competitors_hotel_id_competitor_name_key UNIQUE (hotel_id, competitor_name);


--
-- TOC entry 5179 (class 2606 OID 35563)
-- Name: hotel_competitors hotel_competitors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_competitors
    ADD CONSTRAINT hotel_competitors_pkey PRIMARY KEY (id);


--
-- TOC entry 5091 (class 2606 OID 34470)
-- Name: hotels hotels_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotels
    ADD CONSTRAINT hotels_name_key UNIQUE (name);


--
-- TOC entry 5093 (class 2606 OID 34468)
-- Name: hotels hotels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotels
    ADD CONSTRAINT hotels_pkey PRIMARY KEY (id);


--
-- TOC entry 5140 (class 2606 OID 34763)
-- Name: inspection_items inspection_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_items
    ADD CONSTRAINT inspection_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5144 (class 2606 OID 34810)
-- Name: inspection_results inspection_results_inspection_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results
    ADD CONSTRAINT inspection_results_inspection_id_item_id_key UNIQUE (inspection_id, item_id);


--
-- TOC entry 5146 (class 2606 OID 34808)
-- Name: inspection_results inspection_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results
    ADD CONSTRAINT inspection_results_pkey PRIMARY KEY (id);


--
-- TOC entry 5148 (class 2606 OID 34851)
-- Name: inspection_tasks inspection_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks
    ADD CONSTRAINT inspection_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5136 (class 2606 OID 34750)
-- Name: inspection_types inspection_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_types
    ADD CONSTRAINT inspection_types_name_key UNIQUE (name);


--
-- TOC entry 5138 (class 2606 OID 34748)
-- Name: inspection_types inspection_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_types
    ADD CONSTRAINT inspection_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5142 (class 2606 OID 34789)
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- TOC entry 5125 (class 2606 OID 34685)
-- Name: permissions permissions_action_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_action_key UNIQUE (action);


--
-- TOC entry 5127 (class 2606 OID 34683)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5155 (class 2606 OID 35229)
-- Name: review_media review_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_pkey PRIMARY KEY (id);


--
-- TOC entry 5129 (class 2606 OID 34690)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 5121 (class 2606 OID 34673)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5123 (class 2606 OID 34671)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 34654)
-- Name: room_production room_production_hotel_id_date_segment_company_pic_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_production
    ADD CONSTRAINT room_production_hotel_id_date_segment_company_pic_name_key UNIQUE (hotel_id, date, segment, company, pic_name);


--
-- TOC entry 5119 (class 2606 OID 34652)
-- Name: room_production room_production_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_production
    ADD CONSTRAINT room_production_pkey PRIMARY KEY (id);


--
-- TOC entry 5134 (class 2606 OID 34732)
-- Name: slides slides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slides
    ADD CONSTRAINT slides_pkey PRIMARY KEY (id);


--
-- TOC entry 5151 (class 2606 OID 35134)
-- Name: trial_balances trial_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trial_balances
    ADD CONSTRAINT trial_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 5095 (class 2606 OID 34478)
-- Name: user_hotel_access user_hotel_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hotel_access
    ADD CONSTRAINT user_hotel_access_pkey PRIMARY KEY (user_id, hotel_id);


--
-- TOC entry 5085 (class 2606 OID 34458)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5087 (class 2606 OID 34454)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5089 (class 2606 OID 34456)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5132 (class 1259 OID 34739)
-- Name: idx_slides_position; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_slides_position ON public.slides USING btree ("position");


--
-- TOC entry 5149 (class 1259 OID 35167)
-- Name: idx_trial_balances_position; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trial_balances_position ON public.trial_balances USING btree ("position");


--
-- TOC entry 5220 (class 2620 OID 36385)
-- Name: audit_agendas set_timestamp_audit_agendas; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_audit_agendas BEFORE UPDATE ON public.audit_agendas FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5221 (class 2620 OID 36386)
-- Name: audit_checklist_categories set_timestamp_audit_checklist_categories; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_audit_checklist_categories BEFORE UPDATE ON public.audit_checklist_categories FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5222 (class 2620 OID 36387)
-- Name: audit_checklist_items set_timestamp_audit_checklist_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_audit_checklist_items BEFORE UPDATE ON public.audit_checklist_items FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5223 (class 2620 OID 36388)
-- Name: audit_results set_timestamp_audit_results; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_audit_results BEFORE UPDATE ON public.audit_results FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5219 (class 2620 OID 36384)
-- Name: guest_review_settings set_timestamp_guest_review_settings; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_guest_review_settings BEFORE UPDATE ON public.guest_review_settings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5218 (class 2620 OID 36383)
-- Name: guest_reviews set_timestamp_guest_reviews; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_guest_reviews BEFORE UPDATE ON public.guest_reviews FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5224 (class 2620 OID 36389)
-- Name: hotel_competitor_data set_timestamp_hotel_competitor_data; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_hotel_competitor_data BEFORE UPDATE ON public.hotel_competitor_data FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5225 (class 2620 OID 35588)
-- Name: hotel_competitors set_timestamp_hotel_competitors; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_hotel_competitors BEFORE UPDATE ON public.hotel_competitors FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5211 (class 2620 OID 36376)
-- Name: hotels set_timestamp_hotels; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_hotels BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5216 (class 2620 OID 36381)
-- Name: inspection_items set_timestamp_inspection_items; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_inspection_items BEFORE UPDATE ON public.inspection_items FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5215 (class 2620 OID 36380)
-- Name: inspection_types set_timestamp_inspection_types; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_inspection_types BEFORE UPDATE ON public.inspection_types FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5213 (class 2620 OID 36378)
-- Name: roles set_timestamp_roles; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_roles BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5212 (class 2620 OID 36377)
-- Name: room_production set_timestamp_room_production; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_room_production BEFORE UPDATE ON public.room_production FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5214 (class 2620 OID 36379)
-- Name: slides set_timestamp_slides; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_slides BEFORE UPDATE ON public.slides FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5217 (class 2620 OID 36382)
-- Name: trial_balances set_timestamp_trial_balances; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_trial_balances BEFORE UPDATE ON public.trial_balances FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5185 (class 2606 OID 34599)
-- Name: actual_dsr actual_dsr_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_dsr
    ADD CONSTRAINT actual_dsr_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5186 (class 2606 OID 34616)
-- Name: actuals actuals_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actuals
    ADD CONSTRAINT actuals_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5191 (class 2606 OID 34717)
-- Name: ar_aging ar_aging_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ar_aging
    ADD CONSTRAINT ar_aging_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5205 (class 2606 OID 35333)
-- Name: audit_agendas audit_agendas_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_agendas
    ADD CONSTRAINT audit_agendas_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5206 (class 2606 OID 35375)
-- Name: audit_checklist_items audit_checklist_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_checklist_items
    ADD CONSTRAINT audit_checklist_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.audit_checklist_categories(id) ON DELETE CASCADE;


--
-- TOC entry 5207 (class 2606 OID 35402)
-- Name: audit_results audit_results_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results
    ADD CONSTRAINT audit_results_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.audit_agendas(id) ON DELETE CASCADE;


--
-- TOC entry 5208 (class 2606 OID 35407)
-- Name: audit_results audit_results_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_results
    ADD CONSTRAINT audit_results_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.audit_checklist_items(id) ON DELETE CASCADE;


--
-- TOC entry 5180 (class 2606 OID 34868)
-- Name: books books_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE SET NULL;


--
-- TOC entry 5184 (class 2606 OID 34550)
-- Name: budget_dsr budget_dsr_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_dsr
    ADD CONSTRAINT budget_dsr_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5183 (class 2606 OID 34501)
-- Name: budgets budgets_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5187 (class 2606 OID 34633)
-- Name: dsr_opening_balances dsr_opening_balances_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dsr_opening_balances
    ADD CONSTRAINT dsr_opening_balances_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5204 (class 2606 OID 35260)
-- Name: guest_review_settings guest_review_settings_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_review_settings
    ADD CONSTRAINT guest_review_settings_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5202 (class 2606 OID 35215)
-- Name: guest_reviews guest_reviews_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_reviews
    ADD CONSTRAINT guest_reviews_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5209 (class 2606 OID 35528)
-- Name: hotel_competitor_data hotel_competitor_data_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_competitor_data
    ADD CONSTRAINT hotel_competitor_data_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5210 (class 2606 OID 35566)
-- Name: hotel_competitors hotel_competitors_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_competitors
    ADD CONSTRAINT hotel_competitors_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5193 (class 2606 OID 34764)
-- Name: inspection_items inspection_items_inspection_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_items
    ADD CONSTRAINT inspection_items_inspection_type_id_fkey FOREIGN KEY (inspection_type_id) REFERENCES public.inspection_types(id) ON DELETE CASCADE;


--
-- TOC entry 5197 (class 2606 OID 34811)
-- Name: inspection_results inspection_results_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results
    ADD CONSTRAINT inspection_results_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;


--
-- TOC entry 5198 (class 2606 OID 34816)
-- Name: inspection_results inspection_results_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_results
    ADD CONSTRAINT inspection_results_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inspection_items(id) ON DELETE CASCADE;


--
-- TOC entry 5199 (class 2606 OID 34862)
-- Name: inspection_tasks inspection_tasks_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks
    ADD CONSTRAINT inspection_tasks_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5200 (class 2606 OID 34852)
-- Name: inspection_tasks inspection_tasks_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks
    ADD CONSTRAINT inspection_tasks_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;


--
-- TOC entry 5201 (class 2606 OID 34857)
-- Name: inspection_tasks inspection_tasks_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspection_tasks
    ADD CONSTRAINT inspection_tasks_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inspection_items(id) ON DELETE CASCADE;


--
-- TOC entry 5194 (class 2606 OID 34790)
-- Name: inspections inspections_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5195 (class 2606 OID 34795)
-- Name: inspections inspections_inspection_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_inspection_type_id_fkey FOREIGN KEY (inspection_type_id) REFERENCES public.inspection_types(id) ON DELETE CASCADE;


--
-- TOC entry 5196 (class 2606 OID 34900)
-- Name: inspections inspections_inspector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5203 (class 2606 OID 35230)
-- Name: review_media review_media_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_media
    ADD CONSTRAINT review_media_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.guest_reviews(id) ON DELETE CASCADE;


--
-- TOC entry 5189 (class 2606 OID 34696)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5190 (class 2606 OID 34691)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5188 (class 2606 OID 34655)
-- Name: room_production room_production_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_production
    ADD CONSTRAINT room_production_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5192 (class 2606 OID 34733)
-- Name: slides slides_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slides
    ADD CONSTRAINT slides_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5181 (class 2606 OID 34484)
-- Name: user_hotel_access user_hotel_access_hotel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hotel_access
    ADD CONSTRAINT user_hotel_access_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- TOC entry 5182 (class 2606 OID 34479)
-- Name: user_hotel_access user_hotel_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_hotel_access
    ADD CONSTRAINT user_hotel_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-12-26 07:58:30

--
-- PostgreSQL database dump complete
--

\unrestrict iFufzem7y78Agdg3cKJeKz6r78AHaWpj4Vw2SIN7kn7pTQYcltWORwAgSm7o5at

