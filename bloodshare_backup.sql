--
-- PostgreSQL database dump
--

\restrict UdtruYgrBPacCpfw004q5GnBpnDd1Nw45VoYcIKVdyB9XUtxEfCgIz3TTE8Fjyf

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: avatars; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.avatars (
    id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    image_url character varying(255) NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.avatars OWNER TO bloodshare;

--
-- Name: avatars_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.avatars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.avatars_id_seq OWNER TO bloodshare;

--
-- Name: avatars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.avatars_id_seq OWNED BY public.avatars.id;


--
-- Name: badges; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.badges (
    id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    image_url character varying(255),
    condition_type character varying(255) NOT NULL,
    condition_valeur integer,
    action_specifique character varying(255),
    statut character varying(255) DEFAULT 'actif'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT badges_condition_type_check CHECK (((condition_type)::text = ANY ((ARRAY['nb_dons'::character varying, 'points_cumules'::character varying, 'action_specifique'::character varying])::text[]))),
    CONSTRAINT badges_statut_check CHECK (((statut)::text = ANY ((ARRAY['actif'::character varying, 'inactif'::character varying])::text[])))
);


ALTER TABLE public.badges OWNER TO bloodshare;

--
-- Name: badges_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.badges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.badges_id_seq OWNER TO bloodshare;

--
-- Name: badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;


--
-- Name: bannieres; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.bannieres (
    id bigint NOT NULL,
    admin_id bigint,
    titre character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(255) DEFAULT 'info'::character varying NOT NULL,
    active boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT bannieres_type_check CHECK (((type)::text = ANY ((ARRAY['info'::character varying, 'alerte'::character varying, 'urgence'::character varying])::text[])))
);


ALTER TABLE public.bannieres OWNER TO bloodshare;

--
-- Name: bannieres_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.bannieres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bannieres_id_seq OWNER TO bloodshare;

--
-- Name: bannieres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.bannieres_id_seq OWNED BY public.bannieres.id;


--
-- Name: benevoles; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.benevoles (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    motivation character varying(255),
    statut character varying(255) DEFAULT 'en_attente'::character varying NOT NULL,
    valide_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT benevoles_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'valide'::character varying, 'refuse'::character varying])::text[])))
);


ALTER TABLE public.benevoles OWNER TO bloodshare;

--
-- Name: benevoles_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.benevoles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.benevoles_id_seq OWNER TO bloodshare;

--
-- Name: benevoles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.benevoles_id_seq OWNED BY public.benevoles.id;


--
-- Name: boosters; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.boosters (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    scan_id bigint NOT NULL,
    source character varying(255) NOT NULL,
    statut character varying(255) DEFAULT 'non_ouvert'::character varying NOT NULL,
    obtenu_at timestamp(0) without time zone NOT NULL,
    ouvert_at timestamp(0) without time zone,
    CONSTRAINT boosters_source_check CHECK (((source)::text = ANY ((ARRAY['don'::character varying, 'evenement'::character varying])::text[]))),
    CONSTRAINT boosters_statut_check CHECK (((statut)::text = ANY ((ARRAY['non_ouvert'::character varying, 'ouvert'::character varying])::text[])))
);


ALTER TABLE public.boosters OWNER TO bloodshare;

--
-- Name: boosters_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.boosters_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.boosters_id_seq OWNER TO bloodshare;

--
-- Name: boosters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.boosters_id_seq OWNED BY public.boosters.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


ALTER TABLE public.cache OWNER TO bloodshare;

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO bloodshare;

--
-- Name: cartes; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.cartes (
    id bigint NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    image_url character varying(255),
    rarete character varying(255) NOT NULL,
    statut character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT cartes_rarete_check CHECK (((rarete)::text = ANY ((ARRAY['commun'::character varying, 'rare'::character varying])::text[]))),
    CONSTRAINT cartes_statut_check CHECK (((statut)::text = ANY ((ARRAY['active'::character varying, 'desactivee'::character varying])::text[])))
);


ALTER TABLE public.cartes OWNER TO bloodshare;

--
-- Name: cartes_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.cartes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cartes_id_seq OWNER TO bloodshare;

--
-- Name: cartes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.cartes_id_seq OWNED BY public.cartes.id;


--
-- Name: contenus; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.contenus (
    id bigint NOT NULL,
    admin_id bigint,
    type character varying(255) NOT NULL,
    titre character varying(255) NOT NULL,
    contenu text NOT NULL,
    image_url character varying(255),
    categorie character varying(255),
    statut character varying(255) DEFAULT 'brouillon'::character varying NOT NULL,
    published_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT contenus_statut_check CHECK (((statut)::text = ANY ((ARRAY['brouillon'::character varying, 'publie'::character varying])::text[]))),
    CONSTRAINT contenus_type_check CHECK (((type)::text = ANY ((ARRAY['fiche_info'::character varying, 'actualite'::character varying])::text[])))
);


ALTER TABLE public.contenus OWNER TO bloodshare;

--
-- Name: contenus_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.contenus_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contenus_id_seq OWNER TO bloodshare;

--
-- Name: contenus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.contenus_id_seq OWNED BY public.contenus.id;


--
-- Name: defis; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.defis (
    id bigint NOT NULL,
    admin_id bigint,
    titre character varying(255) NOT NULL,
    description text,
    type character varying(255) NOT NULL,
    periode character varying(255) NOT NULL,
    condition_type character varying(255) NOT NULL,
    objectif_chiffre integer,
    points_attribues integer DEFAULT 0 NOT NULL,
    statut character varying(255) DEFAULT 'brouillon'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT defis_condition_type_check CHECK (((condition_type)::text = ANY ((ARRAY['nb_dons'::character varying, 'quiz'::character varying, 'qr_code'::character varying])::text[]))),
    CONSTRAINT defis_periode_check CHECK (((periode)::text = ANY ((ARRAY['permanent'::character varying, 'mensuel'::character varying])::text[]))),
    CONSTRAINT defis_statut_check CHECK (((statut)::text = ANY ((ARRAY['brouillon'::character varying, 'actif'::character varying, 'termine'::character varying])::text[]))),
    CONSTRAINT defis_type_check CHECK (((type)::text = ANY ((ARRAY['individuel'::character varying, 'communautaire'::character varying])::text[])))
);


ALTER TABLE public.defis OWNER TO bloodshare;

--
-- Name: defis_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.defis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.defis_id_seq OWNER TO bloodshare;

--
-- Name: defis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.defis_id_seq OWNED BY public.defis.id;


--
-- Name: dons; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.dons (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    scan_id bigint,
    date_don timestamp(0) without time zone NOT NULL,
    statut character varying(255) DEFAULT 'en_attente'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT dons_statut_check CHECK (((statut)::text = ANY ((ARRAY['valide'::character varying, 'en_attente'::character varying])::text[])))
);


ALTER TABLE public.dons OWNER TO bloodshare;

--
-- Name: dons_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.dons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dons_id_seq OWNER TO bloodshare;

--
-- Name: dons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.dons_id_seq OWNED BY public.dons.id;


--
-- Name: evenements; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.evenements (
    id bigint NOT NULL,
    admin_id bigint,
    qr_code_id uuid,
    titre character varying(255) NOT NULL,
    description text,
    lieu character varying(255) NOT NULL,
    date_heure timestamp(0) without time zone NOT NULL,
    statut character varying(255) DEFAULT 'brouillon'::character varying NOT NULL,
    image_url character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    horaire_fin timestamp(0) without time zone,
    CONSTRAINT evenements_statut_check CHECK (((statut)::text = ANY ((ARRAY['brouillon'::character varying, 'publie'::character varying, 'annule'::character varying, 'passe'::character varying])::text[])))
);


ALTER TABLE public.evenements OWNER TO bloodshare;

--
-- Name: evenements_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.evenements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.evenements_id_seq OWNER TO bloodshare;

--
-- Name: evenements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.evenements_id_seq OWNED BY public.evenements.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO bloodshare;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.failed_jobs_id_seq OWNER TO bloodshare;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: faq; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.faq (
    id bigint NOT NULL,
    admin_id bigint,
    categorie character varying(255) NOT NULL,
    question character varying(255) NOT NULL,
    reponse text NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.faq OWNER TO bloodshare;

--
-- Name: faq_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.faq_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.faq_id_seq OWNER TO bloodshare;

--
-- Name: faq_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.faq_id_seq OWNED BY public.faq.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO bloodshare;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO bloodshare;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jobs_id_seq OWNER TO bloodshare;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO bloodshare;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO bloodshare;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: model_has_permissions; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.model_has_permissions (
    permission_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


ALTER TABLE public.model_has_permissions OWNER TO bloodshare;

--
-- Name: model_has_roles; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.model_has_roles (
    role_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


ALTER TABLE public.model_has_roles OWNER TO bloodshare;

--
-- Name: parrainages; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.parrainages (
    id bigint NOT NULL,
    parrain_id bigint NOT NULL,
    filleul_id bigint NOT NULL,
    statut character varying(255) DEFAULT 'en_attente'::character varying NOT NULL,
    valide_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT parrainages_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'valide'::character varying])::text[])))
);


ALTER TABLE public.parrainages OWNER TO bloodshare;

--
-- Name: parrainages_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.parrainages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.parrainages_id_seq OWNER TO bloodshare;

--
-- Name: parrainages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.parrainages_id_seq OWNED BY public.parrainages.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO bloodshare;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.permissions OWNER TO bloodshare;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permissions_id_seq OWNER TO bloodshare;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: points_historique; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.points_historique (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    points integer NOT NULL,
    source character varying(255) NOT NULL,
    source_id character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT points_historique_source_check CHECK (((source)::text = ANY ((ARRAY['don'::character varying, 'quiz'::character varying, 'defi'::character varying, 'qr_code'::character varying, 'parrainage'::character varying])::text[])))
);


ALTER TABLE public.points_historique OWNER TO bloodshare;

--
-- Name: points_historique_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.points_historique_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.points_historique_id_seq OWNER TO bloodshare;

--
-- Name: points_historique_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.points_historique_id_seq OWNED BY public.points_historique.id;


--
-- Name: qr_code_scans; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.qr_code_scans (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    qr_code_id uuid NOT NULL,
    points_attribues integer DEFAULT 0 NOT NULL,
    booster_attribue boolean DEFAULT false NOT NULL,
    scanned_at timestamp(0) without time zone NOT NULL
);


ALTER TABLE public.qr_code_scans OWNER TO bloodshare;

--
-- Name: qr_code_scans_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.qr_code_scans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.qr_code_scans_id_seq OWNER TO bloodshare;

--
-- Name: qr_code_scans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.qr_code_scans_id_seq OWNED BY public.qr_code_scans.id;


--
-- Name: qr_codes; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.qr_codes (
    id uuid NOT NULL,
    type character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    evenement_id bigint,
    actif boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT qr_codes_type_check CHECK (((type)::text = ANY ((ARRAY['centre'::character varying, 'evenement'::character varying])::text[])))
);


ALTER TABLE public.qr_codes OWNER TO bloodshare;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.questions (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    intitule character varying(255) NOT NULL,
    type character varying(255) DEFAULT 'unique'::character varying NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    aleatoire boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT questions_type_check CHECK (((type)::text = ANY ((ARRAY['unique'::character varying, 'multiple'::character varying])::text[])))
);


ALTER TABLE public.questions OWNER TO bloodshare;

--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.questions_id_seq OWNER TO bloodshare;

--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: quiz; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.quiz (
    id bigint NOT NULL,
    admin_id bigint,
    titre character varying(255) NOT NULL,
    description text,
    aleatoire boolean DEFAULT false NOT NULL,
    points_attribues integer DEFAULT 0 NOT NULL,
    statut character varying(255) DEFAULT 'brouillon'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    categorie character varying(255),
    CONSTRAINT quiz_statut_check CHECK (((statut)::text = ANY ((ARRAY['brouillon'::character varying, 'actif'::character varying, 'inactif'::character varying])::text[])))
);


ALTER TABLE public.quiz OWNER TO bloodshare;

--
-- Name: quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quiz_id_seq OWNER TO bloodshare;

--
-- Name: quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.quiz_id_seq OWNED BY public.quiz.id;


--
-- Name: reponses; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.reponses (
    id bigint NOT NULL,
    question_id bigint NOT NULL,
    texte character varying(255) NOT NULL,
    est_correcte boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.reponses OWNER TO bloodshare;

--
-- Name: reponses_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.reponses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reponses_id_seq OWNER TO bloodshare;

--
-- Name: reponses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.reponses_id_seq OWNED BY public.reponses.id;


--
-- Name: role_has_permissions; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.role_has_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


ALTER TABLE public.role_has_permissions OWNER TO bloodshare;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.roles OWNER TO bloodshare;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO bloodshare;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO bloodshare;

--
-- Name: stock_sang; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.stock_sang (
    id bigint NOT NULL,
    admin_id bigint,
    groupe_sanguin character varying(255) NOT NULL,
    niveau character varying(255) DEFAULT 'correct'::character varying NOT NULL,
    maj_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT stock_sang_groupe_sanguin_check CHECK (((groupe_sanguin)::text = ANY ((ARRAY['A+'::character varying, 'A-'::character varying, 'B+'::character varying, 'B-'::character varying, 'AB+'::character varying, 'AB-'::character varying, 'O+'::character varying, 'O-'::character varying])::text[]))),
    CONSTRAINT stock_sang_niveau_check CHECK (((niveau)::text = ANY ((ARRAY['critique'::character varying, 'bas'::character varying, 'correct'::character varying, 'bon'::character varying])::text[])))
);


ALTER TABLE public.stock_sang OWNER TO bloodshare;

--
-- Name: stock_sang_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.stock_sang_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stock_sang_id_seq OWNER TO bloodshare;

--
-- Name: stock_sang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.stock_sang_id_seq OWNED BY public.stock_sang.id;


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.user_badges (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    badge_id bigint NOT NULL,
    obtenu_at timestamp(0) without time zone NOT NULL
);


ALTER TABLE public.user_badges OWNER TO bloodshare;

--
-- Name: user_badges_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.user_badges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_badges_id_seq OWNER TO bloodshare;

--
-- Name: user_badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.user_badges_id_seq OWNED BY public.user_badges.id;


--
-- Name: user_cartes; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.user_cartes (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    carte_id bigint NOT NULL,
    booster_id bigint NOT NULL,
    quantite integer DEFAULT 1 NOT NULL,
    obtenue_at timestamp(0) without time zone NOT NULL
);


ALTER TABLE public.user_cartes OWNER TO bloodshare;

--
-- Name: user_cartes_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.user_cartes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_cartes_id_seq OWNER TO bloodshare;

--
-- Name: user_cartes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.user_cartes_id_seq OWNED BY public.user_cartes.id;


--
-- Name: user_defis; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.user_defis (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    defi_id bigint NOT NULL,
    progression integer DEFAULT 0 NOT NULL,
    complete boolean DEFAULT false NOT NULL,
    completed_at timestamp(0) without time zone
);


ALTER TABLE public.user_defis OWNER TO bloodshare;

--
-- Name: user_defis_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.user_defis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_defis_id_seq OWNER TO bloodshare;

--
-- Name: user_defis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.user_defis_id_seq OWNED BY public.user_defis.id;


--
-- Name: user_quiz; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.user_quiz (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    complete boolean DEFAULT false NOT NULL,
    completed_at timestamp(0) without time zone,
    points_attribues boolean DEFAULT false NOT NULL,
    nb_tentatives integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.user_quiz OWNER TO bloodshare;

--
-- Name: user_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.user_quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_quiz_id_seq OWNER TO bloodshare;

--
-- Name: user_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.user_quiz_id_seq OWNED BY public.user_quiz.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: bloodshare
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    pseudo character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    sexe character varying(255),
    groupe_sanguin character varying(255),
    statut character varying(255) DEFAULT 'actif'::character varying NOT NULL,
    motif_suspension character varying(255),
    points_cumules integer DEFAULT 0 NOT NULL,
    derniere_connexion timestamp(0) without time zone,
    avatar_id bigint,
    CONSTRAINT users_groupe_sanguin_check CHECK (((groupe_sanguin)::text = ANY ((ARRAY['A+'::character varying, 'A-'::character varying, 'B+'::character varying, 'B-'::character varying, 'AB+'::character varying, 'AB-'::character varying, 'O+'::character varying, 'O-'::character varying])::text[]))),
    CONSTRAINT users_sexe_check CHECK (((sexe)::text = ANY ((ARRAY['homme'::character varying, 'femme'::character varying])::text[]))),
    CONSTRAINT users_statut_check CHECK (((statut)::text = ANY ((ARRAY['actif'::character varying, 'suspendu'::character varying, 'supprime'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO bloodshare;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: bloodshare
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO bloodshare;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bloodshare
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: avatars id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.avatars ALTER COLUMN id SET DEFAULT nextval('public.avatars_id_seq'::regclass);


--
-- Name: badges id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);


--
-- Name: bannieres id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.bannieres ALTER COLUMN id SET DEFAULT nextval('public.bannieres_id_seq'::regclass);


--
-- Name: benevoles id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.benevoles ALTER COLUMN id SET DEFAULT nextval('public.benevoles_id_seq'::regclass);


--
-- Name: boosters id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.boosters ALTER COLUMN id SET DEFAULT nextval('public.boosters_id_seq'::regclass);


--
-- Name: cartes id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.cartes ALTER COLUMN id SET DEFAULT nextval('public.cartes_id_seq'::regclass);


--
-- Name: contenus id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.contenus ALTER COLUMN id SET DEFAULT nextval('public.contenus_id_seq'::regclass);


--
-- Name: defis id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.defis ALTER COLUMN id SET DEFAULT nextval('public.defis_id_seq'::regclass);


--
-- Name: dons id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.dons ALTER COLUMN id SET DEFAULT nextval('public.dons_id_seq'::regclass);


--
-- Name: evenements id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.evenements ALTER COLUMN id SET DEFAULT nextval('public.evenements_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: faq id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.faq ALTER COLUMN id SET DEFAULT nextval('public.faq_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: parrainages id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.parrainages ALTER COLUMN id SET DEFAULT nextval('public.parrainages_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: points_historique id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.points_historique ALTER COLUMN id SET DEFAULT nextval('public.points_historique_id_seq'::regclass);


--
-- Name: qr_code_scans id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.qr_code_scans ALTER COLUMN id SET DEFAULT nextval('public.qr_code_scans_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: quiz id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.quiz ALTER COLUMN id SET DEFAULT nextval('public.quiz_id_seq'::regclass);


--
-- Name: reponses id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.reponses ALTER COLUMN id SET DEFAULT nextval('public.reponses_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: stock_sang id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.stock_sang ALTER COLUMN id SET DEFAULT nextval('public.stock_sang_id_seq'::regclass);


--
-- Name: user_badges id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_badges ALTER COLUMN id SET DEFAULT nextval('public.user_badges_id_seq'::regclass);


--
-- Name: user_cartes id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_cartes ALTER COLUMN id SET DEFAULT nextval('public.user_cartes_id_seq'::regclass);


--
-- Name: user_defis id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_defis ALTER COLUMN id SET DEFAULT nextval('public.user_defis_id_seq'::regclass);


--
-- Name: user_quiz id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_quiz ALTER COLUMN id SET DEFAULT nextval('public.user_quiz_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: avatars; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.avatars (id, nom, image_url, actif, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.badges (id, nom, image_url, condition_type, condition_valeur, action_specifique, statut, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bannieres; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.bannieres (id, admin_id, titre, message, type, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: benevoles; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.benevoles (id, user_id, motivation, statut, valide_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: boosters; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.boosters (id, user_id, scan_id, source, statut, obtenu_at, ouvert_at) FROM stdin;
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.cache (key, value, expiration) FROM stdin;
livewire-rate-limiter:5b5e86c7b451e5528739380cdc97d0344b1eb460:timer	i:1780368137;	1780368137
livewire-rate-limiter:5b5e86c7b451e5528739380cdc97d0344b1eb460	i:1;	1780368137
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: cartes; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.cartes (id, titre, description, image_url, rarete, statut, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contenus; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.contenus (id, admin_id, type, titre, contenu, image_url, categorie, statut, published_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: defis; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.defis (id, admin_id, titre, description, type, periode, condition_type, objectif_chiffre, points_attribues, statut, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dons; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.dons (id, user_id, scan_id, date_don, statut, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: evenements; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.evenements (id, admin_id, qr_code_id, titre, description, lieu, date_heure, statut, image_url, created_at, updated_at, horaire_fin) FROM stdin;
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: faq; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.faq (id, admin_id, categorie, question, reponse, ordre, actif, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2026_06_02_022911_create_permission_tables	2
5	2026_06_02_032011_modify_users_table	3
6	2026_06_02_032318_create_evenements_table	4
7	2026_06_02_034433_create_dons_table	5
8	2026_06_02_040306_create_qr_codes_table	5
9	2026_06_02_040707_create_qr_code_scans_table	5
10	2026_06_02_040945_create_boosters_table	5
11	2026_06_02_042030_create_cartes_table	5
12	2026_06_02_043015_create_badges_table	5
13	2026_06_02_043319_create_user_cartes_table	6
14	2026_06_02_043423_create_user_badges_table	6
15	2026_06_02_043740_create_defis_table	6
16	2026_06_02_044935_create_user_defis_table	6
17	2026_06_02_045118_create_quiz_table	6
18	2026_06_02_051155_create_questions_table	6
19	2026_06_02_052247_create_reponses_table	6
20	2026_06_02_052410_create_user_quiz_table	6
21	2026_06_02_052920_create_contenus_table	6
22	2026_06_02_053151_create_bannieres_table	6
23	2026_06_02_053544_create_points_historique_table	6
24	2026_06_02_053656_create_stock_sang_table	6
25	2026_06_03_002028_add_avatar_to_users_table	7
26	2026_06_03_002211_add_categorie_to_quiz_table	7
27	2026_06_03_002344_modify_user_quiz_table	7
28	2026_06_03_002506_create_avatars_table	7
29	2026_06_03_002531_create_parrainages_table	7
30	2026_06_03_002544_create_benevoles_table	7
31	2026_06_03_002558_create_faq_table	7
32	2026_06_03_031401_update_users_remove_nom_prenom	8
33	2026_06_03_031833_update_users_remove_nom_prenom	9
34	2026_06_03_082132_fix_contenus_remove_don_du_mois	10
35	2026_06_03_082335_link_avatar_to_users	10
36	2026_06_03_082526_fix_defis_admin_nullable	10
37	2026_06_03_082642_add_horaire_fin_to_evenements	10
38	2026_06_03_082727_add_timestamps_to_stock_sang	10
\.


--
-- Data for Name: model_has_permissions; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.model_has_permissions (permission_id, model_type, model_id) FROM stdin;
\.


--
-- Data for Name: model_has_roles; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.model_has_roles (role_id, model_type, model_id) FROM stdin;
1	App\\Models\\User	1
\.


--
-- Data for Name: parrainages; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.parrainages (id, parrain_id, filleul_id, statut, valide_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.permissions (id, name, guard_name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: points_historique; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.points_historique (id, user_id, points, source, source_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: qr_code_scans; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.qr_code_scans (id, user_id, qr_code_id, points_attribues, booster_attribue, scanned_at) FROM stdin;
\.


--
-- Data for Name: qr_codes; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.qr_codes (id, type, token, evenement_id, actif, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.questions (id, quiz_id, intitule, type, ordre, aleatoire, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.quiz (id, admin_id, titre, description, aleatoire, points_attribues, statut, created_at, updated_at, categorie) FROM stdin;
\.


--
-- Data for Name: reponses; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.reponses (id, question_id, texte, est_correcte, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role_has_permissions; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.role_has_permissions (permission_id, role_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.roles (id, name, guard_name, created_at, updated_at) FROM stdin;
1	super_admin	web	2026-06-02 02:49:23	2026-06-02 02:49:23
2	admin	web	2026-06-02 02:49:23	2026-06-02 02:49:23
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
TIuSNPgtalB1jlAkseNqX3p9Col1trro727khJ8B	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.122.1 Chrome/142.0.7444.265 Electron/39.8.8 Safari/537.36	YTozOntzOjY6Il90b2tlbiI7czo0MDoicVVJOGdHb1VzOWNXNU11RmxIWXc4NG9oZHlvdkJTaGNzZXJ2c1ZJdyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hZG1pbi9sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=	1780368049
LkaRNVNROhNmOxdGLjPuJqJCMZXR3PtfcXzMDGUO	1	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0	YTo1OntzOjY6Il90b2tlbiI7czo0MDoiZUp0YVZ1bXEwZzdSYm9EMnRsZ0lIZTRWV3BaZ1p5Ump0ME5MTEh5YSI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hZG1pbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjE7czoxNzoicGFzc3dvcmRfaGFzaF93ZWIiO3M6NjA6IiQyeSQxMiRMN1plLkJ5UDN2d2pVZzRESmtIcGxPTVloWnZFTmRZSzJvajQwc2hhR1NyWnNPSGFKaTlaMiI7fQ==	1780368401
ma1Og5fCvbjCV0O7UKN3n4tn68zSQdm8uGlS1hKj	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0	YTo0OntzOjY6Il90b2tlbiI7czo0MDoidWRTeDRMeE83NWNiRjJDTVFlV0czb1UzaXl3MGJmSDFwNVNqc0t2SCI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czoyNzoiaHR0cDovL2xvY2FsaG9zdDo4MDAwL2FkbWluIjt9czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hZG1pbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=	1780435681
7nVxxcx4S3XoBJKe3qCvxRBAtd1QBE7xhFCJEQJA	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0	YTo0OntzOjY6Il90b2tlbiI7czo0MDoid0d2b0dKckNJTHh4SHdnelJjajB6UmhjekNMMmJpWTFncXpzQ21rTiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hZG1pbi9sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6MzoidXJsIjthOjE6e3M6ODoiaW50ZW5kZWQiO3M6Mjc6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hZG1pbiI7fX0=	1780435740
\.


--
-- Data for Name: stock_sang; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.stock_sang (id, admin_id, groupe_sanguin, niveau, maj_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.user_badges (id, user_id, badge_id, obtenu_at) FROM stdin;
\.


--
-- Data for Name: user_cartes; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.user_cartes (id, user_id, carte_id, booster_id, quantite, obtenue_at) FROM stdin;
\.


--
-- Data for Name: user_defis; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.user_defis (id, user_id, defi_id, progression, complete, completed_at) FROM stdin;
\.


--
-- Data for Name: user_quiz; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.user_quiz (id, user_id, quiz_id, score, complete, completed_at, points_attribues, nb_tentatives) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: bloodshare
--

COPY public.users (id, pseudo, email, email_verified_at, password, remember_token, created_at, updated_at, sexe, groupe_sanguin, statut, motif_suspension, points_cumules, derniere_connexion, avatar_id) FROM stdin;
1	BSWAG	ygjjk16@gmail.com	\N	$2y$12$L7Ze.ByP3vwjUg4DJkHplOMYhZvENdYK2oj40shaGSrZsOHaJi9Z2	\N	2026-06-02 02:37:11	2026-06-02 02:37:11	\N	\N	actif	\N	0	\N	\N
\.


--
-- Name: avatars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.avatars_id_seq', 1, false);


--
-- Name: badges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.badges_id_seq', 1, false);


--
-- Name: bannieres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.bannieres_id_seq', 1, false);


--
-- Name: benevoles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.benevoles_id_seq', 1, false);


--
-- Name: boosters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.boosters_id_seq', 1, false);


--
-- Name: cartes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.cartes_id_seq', 1, false);


--
-- Name: contenus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.contenus_id_seq', 1, false);


--
-- Name: defis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.defis_id_seq', 1, false);


--
-- Name: dons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.dons_id_seq', 1, false);


--
-- Name: evenements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.evenements_id_seq', 1, false);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: faq_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.faq_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.migrations_id_seq', 38, true);


--
-- Name: parrainages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.parrainages_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1, false);


--
-- Name: points_historique_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.points_historique_id_seq', 1, false);


--
-- Name: qr_code_scans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.qr_code_scans_id_seq', 1, false);


--
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.questions_id_seq', 1, false);


--
-- Name: quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.quiz_id_seq', 1, false);


--
-- Name: reponses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.reponses_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.roles_id_seq', 2, true);


--
-- Name: stock_sang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.stock_sang_id_seq', 1, false);


--
-- Name: user_badges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.user_badges_id_seq', 1, false);


--
-- Name: user_cartes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.user_cartes_id_seq', 1, false);


--
-- Name: user_defis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.user_defis_id_seq', 1, false);


--
-- Name: user_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.user_quiz_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bloodshare
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: bannieres bannieres_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.bannieres
    ADD CONSTRAINT bannieres_pkey PRIMARY KEY (id);


--
-- Name: benevoles benevoles_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.benevoles
    ADD CONSTRAINT benevoles_pkey PRIMARY KEY (id);


--
-- Name: boosters boosters_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.boosters
    ADD CONSTRAINT boosters_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: cartes cartes_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.cartes
    ADD CONSTRAINT cartes_pkey PRIMARY KEY (id);


--
-- Name: contenus contenus_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.contenus
    ADD CONSTRAINT contenus_pkey PRIMARY KEY (id);


--
-- Name: defis defis_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.defis
    ADD CONSTRAINT defis_pkey PRIMARY KEY (id);


--
-- Name: dons dons_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.dons
    ADD CONSTRAINT dons_pkey PRIMARY KEY (id);


--
-- Name: evenements evenements_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.evenements
    ADD CONSTRAINT evenements_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: faq faq_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.faq
    ADD CONSTRAINT faq_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (permission_id, model_id, model_type);


--
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (role_id, model_id, model_type);


--
-- Name: parrainages parrainages_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.parrainages
    ADD CONSTRAINT parrainages_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: permissions permissions_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: points_historique points_historique_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.points_historique
    ADD CONSTRAINT points_historique_pkey PRIMARY KEY (id);


--
-- Name: qr_code_scans qr_code_scans_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.qr_code_scans
    ADD CONSTRAINT qr_code_scans_pkey PRIMARY KEY (id);


--
-- Name: qr_codes qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_pkey PRIMARY KEY (id);


--
-- Name: qr_codes qr_codes_token_unique; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_token_unique UNIQUE (token);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (id);


--
-- Name: reponses reponses_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.reponses
    ADD CONSTRAINT reponses_pkey PRIMARY KEY (id);


--
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles roles_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: stock_sang stock_sang_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.stock_sang
    ADD CONSTRAINT stock_sang_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_cartes user_cartes_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_cartes
    ADD CONSTRAINT user_cartes_pkey PRIMARY KEY (id);


--
-- Name: user_defis user_defis_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_defis
    ADD CONSTRAINT user_defis_pkey PRIMARY KEY (id);


--
-- Name: user_quiz user_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_quiz
    ADD CONSTRAINT user_quiz_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: bloodshare
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: model_has_permissions_model_id_model_type_index; Type: INDEX; Schema: public; Owner: bloodshare
--

CREATE INDEX model_has_permissions_model_id_model_type_index ON public.model_has_permissions USING btree (model_id, model_type);


--
-- Name: model_has_roles_model_id_model_type_index; Type: INDEX; Schema: public; Owner: bloodshare
--

CREATE INDEX model_has_roles_model_id_model_type_index ON public.model_has_roles USING btree (model_id, model_type);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: bloodshare
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: bloodshare
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: bannieres bannieres_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.bannieres
    ADD CONSTRAINT bannieres_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: benevoles benevoles_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.benevoles
    ADD CONSTRAINT benevoles_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: boosters boosters_scan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.boosters
    ADD CONSTRAINT boosters_scan_id_foreign FOREIGN KEY (scan_id) REFERENCES public.qr_code_scans(id) ON DELETE CASCADE;


--
-- Name: boosters boosters_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.boosters
    ADD CONSTRAINT boosters_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contenus contenus_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.contenus
    ADD CONSTRAINT contenus_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: defis defis_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.defis
    ADD CONSTRAINT defis_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dons dons_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.dons
    ADD CONSTRAINT dons_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: evenements evenements_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.evenements
    ADD CONSTRAINT evenements_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: faq faq_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.faq
    ADD CONSTRAINT faq_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: model_has_permissions model_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: model_has_roles model_has_roles_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: parrainages parrainages_filleul_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.parrainages
    ADD CONSTRAINT parrainages_filleul_id_foreign FOREIGN KEY (filleul_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: parrainages parrainages_parrain_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.parrainages
    ADD CONSTRAINT parrainages_parrain_id_foreign FOREIGN KEY (parrain_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: points_historique points_historique_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.points_historique
    ADD CONSTRAINT points_historique_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: qr_code_scans qr_code_scans_qr_code_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.qr_code_scans
    ADD CONSTRAINT qr_code_scans_qr_code_id_foreign FOREIGN KEY (qr_code_id) REFERENCES public.qr_codes(id) ON DELETE CASCADE;


--
-- Name: qr_code_scans qr_code_scans_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.qr_code_scans
    ADD CONSTRAINT qr_code_scans_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: qr_codes qr_codes_evenement_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_evenement_id_foreign FOREIGN KEY (evenement_id) REFERENCES public.evenements(id) ON DELETE CASCADE;


--
-- Name: questions questions_quiz_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_quiz_id_foreign FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE;


--
-- Name: quiz quiz_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reponses reponses_question_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.reponses
    ADD CONSTRAINT reponses_question_id_foreign FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: stock_sang stock_sang_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.stock_sang
    ADD CONSTRAINT stock_sang_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_badges user_badges_badge_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_foreign FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_cartes user_cartes_booster_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_cartes
    ADD CONSTRAINT user_cartes_booster_id_foreign FOREIGN KEY (booster_id) REFERENCES public.boosters(id) ON DELETE CASCADE;


--
-- Name: user_cartes user_cartes_carte_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_cartes
    ADD CONSTRAINT user_cartes_carte_id_foreign FOREIGN KEY (carte_id) REFERENCES public.cartes(id) ON DELETE CASCADE;


--
-- Name: user_cartes user_cartes_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_cartes
    ADD CONSTRAINT user_cartes_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_defis user_defis_defi_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_defis
    ADD CONSTRAINT user_defis_defi_id_foreign FOREIGN KEY (defi_id) REFERENCES public.defis(id) ON DELETE CASCADE;


--
-- Name: user_defis user_defis_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_defis
    ADD CONSTRAINT user_defis_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_quiz user_quiz_quiz_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_quiz
    ADD CONSTRAINT user_quiz_quiz_id_foreign FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE;


--
-- Name: user_quiz user_quiz_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.user_quiz
    ADD CONSTRAINT user_quiz_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_avatar_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: bloodshare
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_foreign FOREIGN KEY (avatar_id) REFERENCES public.avatars(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict UdtruYgrBPacCpfw004q5GnBpnDd1Nw45VoYcIKVdyB9XUtxEfCgIz3TTE8Fjyf

