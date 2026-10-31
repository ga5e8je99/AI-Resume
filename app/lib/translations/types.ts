export type LanguageCode = 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
];

export interface TranslationDictionary {
  // Navigation & Header
  nav_brand: string;
  nav_brand_sub: string;
  nav_resume_builder: string;
  nav_cv_builder: string;
  nav_ats_review: string;
  nav_cover_letter: string;
  nav_job_match: string;
  nav_dashboard: string;
  nav_admin: string;
  nav_login: string;
  nav_signup: string;
  nav_logout: string;
  nav_lang_switch: string;
  nav_services: string;
  nav_templates: string;
  nav_pricing: string;
  nav_tools: string;
  nav_tools_desc: string;
  nav_home: string;

  // Loading & Route Transitions (Task L2)
  loading_preparing_workspace: string;
  loading_document_assets: string;
  loading_generic: string;
  loading_cancel: string;

  // Credits
  credits_label: string;
  credits_remaining: string;
  credits_unlimited: string;
  credits_upgrade_title: string;
  credits_upgrade_desc: string;
  credits_view_plans: string;

  // Legacy Services Suite Section
  services_tag: string;
  services_title: string;
  services_desc: string;
  service_resume_title: string;
  service_resume_badge: string;
  service_resume_desc: string;
  service_resume_action: string;
  service_cv_title: string;
  service_cv_badge: string;
  service_cv_desc: string;
  service_cv_action: string;
  service_cover_title: string;
  service_cover_badge: string;
  service_cover_desc: string;
  service_cover_action: string;
  service_review_title: string;
  service_review_badge: string;
  service_review_desc: string;
  service_review_action: string;

  // Hero Section
  hero_badge: string;
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_title_suffix: string;
  hero_desc: string;
  hero_cta_create: string;
  hero_cta_create_desc: string;
  hero_cta_analyze: string;
  hero_cta_analyze_desc: string;
  hero_metric_skills: string;
  hero_metric_privacy: string;
  hero_metric_export: string;
  hero_eyebrow: string;
  hero_headline_part1: string;
  hero_headline_highlight: string;
  hero_headline_part2: string;
  hero_subheadline: string;
  hero_primary_cta: string;
  hero_secondary_cta: string;
  hero_trust_line: string;
  hero_badge_ats: string;
  hero_badge_preview: string;

  // Trust Strip (Honest Facts Only)
  trust_strip_aria: string;
  trust_fact_templates_title: string;
  trust_fact_templates_desc: string;
  trust_fact_languages_title: string;
  trust_fact_languages_desc: string;
  trust_fact_export_title: string;
  trust_fact_export_desc: string;
  trust_fact_privacy_title: string;
  trust_fact_privacy_desc: string;

  // How It Works
  how_it_works_tag: string;
  how_it_works_title: string;
  how_it_works_desc: string;
  how_step_1_title: string;
  how_step_1_desc: string;
  how_step_1_meta: string;
  how_step_2_title: string;
  how_step_2_desc: string;
  how_step_2_meta: string;
  how_step_3_title: string;
  how_step_3_desc: string;
  how_step_3_meta: string;
  how_try_it_banner: string;

  // Upload & Analyzer Dropzone
  upload_section_tag: string;
  upload_section_title: string;
  upload_section_desc: string;
  upload_drop_title: string;
  upload_drop_sub: string;
  upload_drop_browse: string;
  upload_privacy_notice: string;
  upload_file_selected: string;
  upload_file_chars: string;
  upload_paste_label: string;
  upload_paste_placeholder: string;
  upload_job_title_label: string;
  upload_job_title_placeholder: string;
  upload_job_title_hint: string;
  upload_job_desc_label: string;
  upload_job_desc_placeholder: string;
  upload_job_desc_hint: string;
  upload_submit_btn: string;
  upload_submitting_btn: string;
  upload_sample_btn: string;
  upload_clear_btn: string;

  // Feature Showcase
  features_tag: string;
  features_title: string;
  features_desc: string;
  // Row 1: ATS Scanner
  feature_ats_tag: string;
  feature_ats_title: string;
  feature_ats_desc: string;
  feature_ats_bullet1: string;
  feature_ats_bullet2: string;
  feature_ats_bullet3: string;
  feature_ats_cta: string;
  feature_ats_card_tag: string;
  feature_ats_card_badge: string;
  feature_ats_card_score_title: string;
  feature_ats_card_score_desc: string;
  feature_ats_card_meter1: string;
  feature_ats_card_meter2: string;
  feature_ats_card_meter3: string;
  // Row 2: Resume & CV Builder
  feature_builder_tag: string;
  feature_builder_title: string;
  feature_builder_desc: string;
  feature_builder_bullet1: string;
  feature_builder_bullet2: string;
  feature_builder_bullet3: string;
  feature_builder_cta: string;
  feature_builder_card_badge: string;
  feature_builder_card_fields: string;
  feature_builder_card_role: string;
  feature_builder_card_summary: string;
  feature_builder_card_skills: string;
  feature_builder_card_preview: string;
  // Row 3: AI Cover Letter
  feature_cover_tag: string;
  feature_cover_title: string;
  feature_cover_desc: string;
  feature_cover_bullet1: string;
  feature_cover_bullet2: string;
  feature_cover_bullet3: string;
  feature_cover_cta: string;
  feature_cover_card_tone: string;
  feature_cover_card_tag1: string;
  feature_cover_card_tag2: string;
  feature_cover_card_tag3: string;
  // Row 4: Smart Job Match
  feature_match_tag: string;
  feature_match_title: string;
  feature_match_desc: string;
  feature_match_bullet1: string;
  feature_match_bullet2: string;
  feature_match_bullet3: string;
  feature_match_cta: string;
  feature_match_card1_title: string;
  feature_match_card1_meta: string;
  feature_match_card1_sub: string;
  feature_match_card2_title: string;
  feature_match_card2_meta: string;
  feature_match_card2_sub: string;
  feature_match_card3_title: string;
  feature_match_card3_meta: string;
  feature_match_card3_sub: string;
  // Row 5: Multi-Language
  feature_lang_tag: string;
  feature_lang_title: string;
  feature_lang_desc: string;
  feature_lang_bullet1: string;
  feature_lang_bullet2: string;
  feature_lang_bullet3: string;
  feature_lang_card_title: string;
  feature_lang_card_badge: string;
  feature_lang_card_footer: string;

  // Comparison Section
  comparison_tag: string;
  comparison_title: string;
  comparison_desc: string;
  comparison_before_tag: string;
  comparison_before_title: string;
  comparison_before_score: string;
  comparison_before_b1: string;
  comparison_before_b2: string;
  comparison_before_b3: string;
  comparison_before_b4: string;
  comparison_after_tag: string;
  comparison_after_title: string;
  comparison_after_score: string;
  comparison_after_b1: string;
  comparison_after_b2: string;
  comparison_after_b3: string;
  comparison_after_b4: string;
  comparison_badge_verified: string;

  // Pricing Teaser
  pricing_teaser_tag: string;
  pricing_teaser_title: string;
  pricing_teaser_desc: string;
  pricing_popular_badge: string;
  pricing_view_full: string;
  pricing_plan_forever: string;
  pricing_plan_per_month: string;
  pricing_plan_one_time: string;

  // FAQ Section
  faq_tag: string;
  faq_title: string;
  faq_desc: string;
  faq_q1_title: string;
  faq_q1_desc: string;
  faq_q2_title: string;
  faq_q2_desc: string;
  faq_q3_title: string;
  faq_q3_desc: string;
  faq_q4_title: string;
  faq_q4_desc: string;
  faq_q5_title: string;
  faq_q5_desc: string;
  faq_q6_title: string;
  faq_q6_desc: string;
  faq_q7_title: string;
  faq_q7_desc: string;
  faq_q8_title: string;
  faq_q8_desc: string;

  // Final CTA Band
  cta_band_eyebrow: string;
  cta_band_title: string;
  cta_band_desc: string;
  cta_band_btn_primary: string;
  cta_band_btn_secondary: string;
  cta_band_trust1: string;
  cta_band_trust2: string;
  cta_band_trust3: string;

  // Pillars & Templates (Legacy)
  pillars_tag: string;
  pillars_title: string;
  pillars_desc: string;
  pillar_1_title: string;
  pillar_1_desc: string;
  pillar_2_title: string;
  pillar_2_desc: string;
  pillar_3_title: string;
  pillar_3_desc: string;
  pillar_4_title: string;
  pillar_4_desc: string;
  templates_tag: string;
  templates_title: string;
  templates_desc: string;
  template_card_use: string;
  template_card_inspect: string;
  template_card_score: string;
  template_1_badge: string;
  template_1_title: string;
  template_1_job: string;
  template_1_summary: string;
  template_2_badge: string;
  template_2_title: string;
  template_2_job: string;
  template_2_summary: string;
  template_3_badge: string;
  template_3_title: string;
  template_3_job: string;
  template_3_summary: string;

  // Common UI Actions & Labels
  common_or: string;
  common_edit_builder: string;
  common_print_vector: string;
  common_download_pdf: string;
  common_download_word: string;
  common_save_cloud: string;
  common_loading: string;
  common_error: string;
  common_success: string;
  common_close: string;
  common_cancel: string;
  common_confirm: string;
  common_delete: string;
  common_back: string;
  common_next: string;
  common_save: string;
  common_copy: string;
  common_copied: string;

  // Auth & Demo
  auth_demo_button: string;
  auth_demo_loading: string;
  auth_demo_desc: string;
  auth_login_title: string;
  auth_login_subtitle: string;
  auth_login_email: string;
  auth_login_password: string;
  auth_login_remember: string;
  auth_login_forgot: string;
  auth_login_submit: string;
  auth_login_no_account: string;
  auth_login_signup_link: string;
  auth_register_title: string;
  auth_register_subtitle: string;
  auth_register_name: string;
  auth_register_email: string;
  auth_register_password: string;
  auth_register_confirm_password: string;
  auth_register_submit: string;
  auth_register_have_account: string;
  auth_register_login_link: string;
  auth_register_terms_notice: string;
  auth_forgot_title: string;
  auth_forgot_subtitle: string;
  auth_forgot_submit: string;
  auth_forgot_back_login: string;
  auth_forgot_success: string;
  auth_reset_title: string;
  auth_reset_subtitle: string;
  auth_reset_submit: string;
  auth_reset_success: string;

  // Errors & 404
  not_found_badge: string;
  not_found_title: string;
  not_found_subtitle: string;
  not_found_desc: string;
  not_found_go_home: string;
  not_found_go_dashboard: string;
  error_badge: string;
  error_title: string;
  error_subtitle: string;
  error_desc: string;
  error_try_again: string;
  error_go_home: string;

  // Dashboard
  dashboard_title: string;
  dashboard_welcome: string;
  dashboard_subtitle: string;
  dashboard_stat_resumes: string;
  dashboard_stat_scans: string;
  dashboard_stat_cover_letters: string;
  dashboard_stat_credits: string;
  dashboard_tab_resumes: string;
  dashboard_tab_scans: string;
  dashboard_tab_letters: string;
  dashboard_tab_settings: string;
  dashboard_btn_new_resume: string;
  dashboard_btn_new_cv: string;
  dashboard_btn_new_scan: string;
  dashboard_btn_new_cover: string;
  dashboard_empty_resumes_title: string;
  dashboard_empty_resumes_desc: string;
  dashboard_empty_scans_title: string;
  dashboard_empty_scans_desc: string;
  dashboard_empty_letters_title: string;
  dashboard_empty_letters_desc: string;
  dashboard_settings_language: string;
  dashboard_settings_language_desc: string;
  dashboard_settings_theme: string;
  dashboard_settings_theme_desc: string;

  // ATS Review Page
  review_header_title: string;
  review_header_subtitle: string;
  review_score_gauge: string;
  review_badge_pass: string;
  review_badge_fail: string;
  review_tab_summary: string;
  review_tab_structure: string;
  review_tab_skills: string;
  review_tab_text: string;
  review_fix_in_builder: string;
  review_rescan: string;

  // Builder Page
  builder_title: string;
  builder_tab_editor: string;
  builder_tab_design: string;
  builder_tab_preview: string;
  builder_personal_info: string;
  builder_summary: string;
  builder_experience: string;
  builder_education: string;
  builder_skills: string;
  builder_projects: string;
  builder_certifications: string;
  builder_add_item: string;
  builder_export_pdf: string;
  builder_export_word: string;

  // Cover Letter Page
  cover_title: string;
  cover_subtitle: string;
  cover_job_title: string;
  cover_company_name: string;
  cover_job_desc: string;
  cover_tone_label: string;
  cover_generate_btn: string;
  cover_generating_btn: string;
  cover_copy_btn: string;
  cover_download_btn: string;

  // Pricing Page
  pricing_page_title: string;
  pricing_page_subtitle: string;
  pricing_curr_usd: string;
  pricing_curr_egp: string;
  pricing_period_monthly: string;
  pricing_period_yearly: string;
  pricing_cta_starter: string;
  pricing_cta_pro: string;
  pricing_cta_pack: string;

  // Footer
  footer_desc: string;
  footer_col_product: string;
  footer_col_resources: string;
  footer_col_legal: string;
  footer_col_tools: string;
  footer_col_account: string;
  footer_privacy: string;
  footer_terms: string;
  footer_rights: string;
  footer_direct_support: string;
  footer_github: string;
  footer_client_privacy: string;

  // Additional Navbar Keys
  nav_tool_builder_title: string;
  nav_tool_builder_desc: string;
  nav_tool_scanner_title: string;
  nav_tool_scanner_desc: string;
  nav_tool_cover_title: string;
  nav_tool_cover_desc: string;
  nav_tool_match_title: string;
  nav_tool_match_desc: string;
  nav_academic_cv_callout: string;
  nav_cta_build: string;
  nav_platform_tools: string;
  nav_academic_cv: string;
  nav_academic_cv_desc: string;
  nav_general: string;
  nav_pricing_plans: string;
  nav_preferences: string;

  // Additional Hero Keys
  hero_scan_cta: string;
  hero_demo_cta: string;
  hero_trust_free: string;
  hero_trust_no_card: string;
  hero_trust_instant: string;
  hero_preview_sample: string;
  hero_preview_iso: string;
  hero_preview_name: string;
  hero_preview_title: string;
  hero_preview_summary_title: string;
  hero_preview_summary_desc: string;
  hero_preview_exp_title: string;
  hero_preview_exp_role: string;
  hero_preview_exp_desc: string;
  hero_preview_kw_title: string;
  hero_preview_kw_matched: string;
  hero_preview_match_score: string;
  hero_preview_verified: string;
  hero_preview_errors: string;

  // Additional Auth Keys
  auth_login_submitting: string;
  auth_login_or_demo: string;
  auth_login_demo_btn: string;
  auth_login_demo_hint: string;
  auth_login_trust_banner_title: string;
  auth_login_trust_feature1: string;
  auth_login_trust_feature2: string;
  auth_login_trust_feature3: string;
  auth_login_quote: string;
  auth_login_quote_author: string;
  auth_register_submitting: string;
  auth_forgot_submitting: string;
  auth_forgot_check_inbox: string;
  auth_forgot_sent_desc: string;
  auth_reset_submitting: string;
  auth_reset_success_title: string;
  auth_reset_success_desc: string;
  auth_reset_go_login: string;
  auth_err_email_required: string;
  auth_err_email_invalid: string;
  auth_err_password_required: string;
  auth_err_password_min: string;
  auth_err_passwords_mismatch: string;
  auth_err_name_required: string;
  auth_err_name_min: string;
  auth_err_login_failed: string;
  auth_err_unexpected: string;

  // Additional Dashboard Keys
  dashboard_greeting_morning: string;
  dashboard_greeting_afternoon: string;
  dashboard_greeting_evening: string;
  dashboard_search_placeholder: string;
  dashboard_filter_all: string;
  dashboard_empty_search: string;
  dashboard_delete_dialog_title: string;
  dashboard_delete_dialog_desc: string;
  dashboard_settings_saved: string;

  // Additional Review Keys
  review_upload_title: string;
  review_upload_subtitle: string;
  review_overall_score: string;
  review_missing_keywords: string;
  review_matching_keywords: string;
  review_structure_checks: string;
  review_fix_action: string;

  // Auth additions
  auth_show_password: string;
  auth_hide_password: string;
  auth_one_click_ready: string;
  auth_pdf_vector: string;
  auth_editable_docx: string;
  auth_instant_rtl_ltr: string;

  // Common additions
  common_quick_links: string;
  common_saved_just_now: string;
  common_skip_content: string;

  // Dashboard additions
  dashboard_rec_step_badge: string;
  dashboard_rec_step_title: string;
  dashboard_rec_step_desc: string;
  dashboard_scan_my_resume: string;
  dashboard_create_scratch: string;
  dashboard_updated_resume: string;
  dashboard_ats_scan: string;
  dashboard_cover_letter: string;
  dashboard_btn_new_academic_cv: string;
  dashboard_action_needed: string;
  dashboard_fix_keywords_title: string;
  dashboard_fix_keywords_desc: string;
  dashboard_fix_in_builder: string;
  dashboard_view_report: string;
  dashboard_tailor_cover_title: string;
  dashboard_tailor_cover_desc: string;
  dashboard_create_cover_letter: string;
  dashboard_recent_activity: string;
  dashboard_no_activity: string;
  dashboard_total_documents: string;
  dashboard_avg_ats_score: string;
  dashboard_credits_available: string;
  dashboard_filter_search: string;
  dashboard_sort_newest: string;
  dashboard_sort_oldest: string;
  dashboard_sort_score: string;
  dashboard_view_all: string;
  dashboard_confirm_delete_title: string;
  dashboard_confirm_delete_desc: string;

  // Review / ATS Scanner additions
  review_stage_reading_label: string;
  review_stage_reading_desc: string;
  review_stage_extracting_label: string;
  review_stage_extracting_desc: string;
  review_stage_analyzing_label: string;
  review_stage_analyzing_desc: string;
  review_stage_scoring_label: string;
  review_stage_scoring_desc: string;
  review_score_excellent: string;
  review_score_excellent_desc: string;
  review_score_good: string;
  review_score_good_desc: string;
  review_score_fair: string;
  review_score_fair_desc: string;
  review_score_poor: string;
  review_score_poor_desc: string;
  review_current_doc: string;
  review_view_raw_text: string;
  review_compare_jd: string;
  review_upload_another: string;
  review_share: string;
  review_print: string;
  review_quick_samples: string;
  review_toast_scanned: string;
  review_toast_link_copied: string;

  // Upgrade Modal additions
  upgrade_modal_tag: string;
  upgrade_modal_title: string;
  upgrade_modal_desc: string;
  upgrade_modal_benefit1: string;
  upgrade_modal_benefit2: string;
  upgrade_modal_benefit3: string;
  upgrade_modal_view_plans: string;
  upgrade_modal_maybe_later: string;

  // Cover Letter additions
  cover_mode_text: string;
  cover_mode_url: string;
  cover_mode_file: string;
  cover_tone_formal: string;
  cover_tone_conversational: string;
  cover_tone_academic: string;
  cover_tone_concise: string;
  cover_sender_info: string;
  cover_sender_name: string;
  cover_sender_email: string;
  cover_sender_phone: string;
  cover_hiring_manager: string;
  cover_custom_notes: string;
  cover_target_doc_language: string;
  cover_saved_drafts: string;
  cover_step1_analyzing: string;
  cover_step2_matching: string;
  cover_step3_synthesizing: string;
  cover_step4_finalizing: string;
  cover_toast_generated: string;
  cover_toast_copied: string;

  // Pricing additions
  pricing_faq_title: string;
  pricing_compare_title: string;
  pricing_feature_scans: string;
  pricing_feature_templates: string;
  pricing_feature_letters: string;
  pricing_feature_export: string;
  pricing_val_unlimited: string;
  pricing_val_unlimited_deep: string;
  pricing_val_2_templates: string;
  pricing_val_all_templates: string;
  pricing_val_3_drafts: string;
  pricing_val_15_credits: string;
  pricing_val_pdf_txt: string;
  pricing_val_vector_docx: string;
  pricing_checkout_gate_soon: string;
  pricing_checkout_failed: string;

  // Builder additions
  builder_languages: string;
  builder_load_sample: string;
  builder_clear_all: string;
  builder_template: string;
  builder_theme: string;
  builder_document_language: string;
  builder_paper_size: string;
  builder_reorder_sections: string;

  // Dashboard UI refinements
  dashboard_item_deleted: string;
  dashboard_item_delete_failed: string;
  dashboard_ai_plan: string;
  dashboard_ai_unlimited: string;
  dashboard_ai_credits_left: string;
  dashboard_ai_pro_desc: string;
  dashboard_ai_free_desc: string;
  dashboard_ai_pro_active: string;
  dashboard_ai_get_unlimited: string;
  dashboard_manage_plan: string;
  dashboard_upgrade_now: string;
  dashboard_kpi_latest_score: string;
  dashboard_kpi_resumes_saved: string;
  dashboard_kpi_cover_letters: string;
  dashboard_kpi_last_activity: string;
  dashboard_kpi_no_scans: string;
  dashboard_kpi_excellent: string;
  dashboard_kpi_good: string;
  dashboard_kpi_needs_work: string;
  dashboard_kpi_scan_benchmark: string;
  dashboard_kpi_parsed_ats: string;
  dashboard_kpi_audit_private: string;
  dashboard_recent_items_title: string;
  dashboard_recent_items_desc: string;
  dashboard_btn_open_edit: string;
  dashboard_btn_duplicate: string;
  dashboard_btn_export: string;
  dashboard_btn_delete: string;
  dashboard_untitled_doc: string;
  dashboard_no_target_title: string;
  dashboard_confirm_delete_btn: string;
  dashboard_cancel_btn: string;

  // Review & ATS diagnostic keys
  review_doc_language: string;
  review_rank: string;
  review_fix_with_builder: string;
  review_compare_job_match: string;
  review_multilingual_notice: string;
  review_stat_words: string;
  review_stat_reading_time: string;
  review_stat_metrics: string;
  review_stat_keywords: string;
  review_breakdown_title: string;
  review_pillar_keywords: string;
  review_pillar_keywords_desc: string;
  review_pillar_formatting: string;
  review_pillar_formatting_desc: string;
  review_pillar_structure: string;
  review_pillar_structure_desc: string;
  review_pillar_content: string;
  review_pillar_content_desc: string;
  review_pillar_contact: string;
  review_contact_email: string;
  review_contact_phone: string;
  review_contact_location: string;
  review_contact_linkedin: string;
  review_keywords_title: string;
  review_keywords_matched_label: string;
  review_keywords_missing_label: string;
  review_keywords_detected_title: string;
  review_keywords_none: string;
  review_keywords_missing_title: string;
  review_keywords_click_to_copy: string;
  review_suggestions_title: string;
  review_priority_high: string;
  review_priority_medium: string;
  review_priority_low: string;
  review_how_to_fix: string;
  review_diagnostic_engine: string;
  review_apply_fixes_builder: string;
  review_modal_jd_title: string;
  review_modal_jd_desc: string;
  review_modal_jd_label: string;
  review_modal_jd_placeholder: string;
  review_modal_jd_analyze: string;
  review_modal_jd_toast: string;
  review_modal_raw_title: string;
  review_modal_raw_desc: string;
  review_modal_raw_chars: string;

  // Common UI actions & CV Builder
  common_exporting: string;
  common_saving: string;
  common_word: string;
  common_export_pdf: string;
  common_back_to_dashboard: string;
  cv_loading: string;

  // Builder Sidebar
  builder_tab_sections: string;
  builder_tab_templates: string;
  builder_tab_style: string;
  builder_sec_personal: string;
  builder_sec_summary: string;
  builder_sec_experience: string;
  builder_sec_education: string;
  builder_sec_projects: string;
  builder_sec_skills: string;
  builder_sec_languages: string;
  builder_sec_certifications: string;

  // Cover Letter Form
  cover_page_title: string;
  cover_reset_btn: string;

  // Subscription & Billing Portal
  billing_manage_subscription: string;
  billing_portal_title: string;
  billing_portal_desc: string;
  billing_current_plan: string;
  billing_expires_on: string;
  billing_expiring_soon_title: string;
  billing_expiring_soon_desc: string;
  billing_renew_now: string;
  billing_payment_failed_title: string;
  billing_payment_failed_desc: string;
  billing_portal_error: string;

  // Payment Success & Cancelled Pages
  payment_confirmed_stripe: string;
  payment_confirmed_paymob: string;
  payment_confirmed_crypto: string;
  payment_success_title: string;
  payment_success_desc_pro: string;
  payment_success_desc_payg: string;
  payment_mock_notice: string;
  payment_go_dashboard: string;
  payment_create_resume: string;
  payment_confirming_title: string;
  payment_confirming_desc: string;
  payment_failed_title: string;
  payment_failed_desc: string;
  payment_retry_btn: string;
  payment_timeout_title: string;
  payment_timeout_desc: string;
  payment_contact_support: string;
  payment_cancelled_title: string;
  payment_cancelled_desc: string;
  payment_cancelled_retry: string;
  payment_return_home: string;

  // Pricing Page Complete i18n & Checkout Error States
  pricing_curr_usdt: string;
  pricing_save_22_badge: string;
  pricing_billed_annually_note: string;
  pricing_or_pay_crypto: string;
  pricing_method_label: string;
  pricing_method_usd_hint: string;
  pricing_method_egp_hint: string;
  pricing_method_usdt_hint: string;
  pricing_trust_encryption: string;
  pricing_trust_instant: string;
  pricing_trust_cancel: string;
  pricing_compare_subtitle: string;
  pricing_compare_col_feature: string;
  pricing_feature_ai_resume: string;
  pricing_val_1_taste: string;
  pricing_val_unlimited_gen: string;
  pricing_val_2_credits_gen: string;
  pricing_feature_job_match: string;
  pricing_val_3_searches: string;
  pricing_val_unlimited_searches: string;
  pricing_val_1_credit_search: string;
  pricing_feature_cloud_storage: string;
  pricing_val_1_resume: string;
  pricing_val_standard_tone: string;
  pricing_val_4_tones: string;
  pricing_val_self_serve_docs: string;
  pricing_val_priority_email: string;
  pricing_val_email_support: string;
  pricing_faq_q_credits: string;
  pricing_faq_a_credits: string;
  pricing_faq_q_billing: string;
  pricing_faq_a_billing: string;
  pricing_faq_q_methods: string;
  pricing_faq_a_methods: string;
  pricing_faq_q_expiry: string;
  pricing_faq_a_expiry: string;
  pricing_faq_q_cancellation: string;
  pricing_faq_a_cancellation: string;
  pricing_err_provider_not_configured: string;
  pricing_err_network: string;
  pricing_err_generic: string;
  pricing_retry_btn: string;
  nav_tool_ai_gen_title: string;
  nav_tool_ai_gen_desc: string;

  // Job Match Provider Status & Error / Empty States
  jobs_partial_providers_failed: string;
  jobs_retry_btn: string;
  jobs_all_providers_failed_title: string;
  jobs_all_providers_failed_desc: string;
  jobs_empty_state_title: string;
  jobs_empty_state_desc: string;
  jobs_reset_filters_btn: string;

  // Job Match Complete Page & Components i18n
  jobs_badge: string;
  jobs_title: string;
  jobs_subtitle: string;
  jobs_pro_unlimited_badge: string;
  jobs_pro_unlimited_sub: string;
  jobs_free_used_label: string;
  jobs_payg_badge: string;
  jobs_free_remaining_label: string;
  jobs_one_credit_per_search: string;
  jobs_view_plans: string;
  jobs_quota_exhausted_title: string;
  jobs_quota_exhausted_desc: string;
  jobs_upgrade_pro_btn: string;
  jobs_params_title: string;
  jobs_params_desc: string;
  jobs_select_resume_aria: string;
  jobs_custom_uploaded_file: string;
  jobs_upload_resume_btn: string;
  jobs_err_extract_empty: string;
  jobs_err_process_file: string;
  jobs_target_title_label: string;
  jobs_top_3_extracted: string;
  jobs_target_title_placeholder: string;
  jobs_location_label: string;
  jobs_location_placeholder: string;
  jobs_country_label: string;
  jobs_country_aria: string;
  jobs_country_eg: string;
  jobs_country_sa: string;
  jobs_country_ae: string;
  jobs_country_us: string;
  jobs_country_gb: string;
  jobs_country_de: string;
  jobs_country_global: string;
  jobs_seniority_label: string;
  jobs_seniority_aria: string;
  jobs_seniority_any: string;
  jobs_seniority_junior: string;
  jobs_seniority_mid: string;
  jobs_seniority_senior: string;
  jobs_seniority_lead: string;
  jobs_work_arrangement_label: string;
  jobs_remote_only_label: string;
  jobs_skills_label: string;
  jobs_skills_count: string;
  jobs_skill_input_placeholder: string;
  jobs_add_skill_btn: string;
  jobs_remove_skill_aria: string;
  jobs_generated_query_label: string;
  jobs_find_matching_btn: string;
  jobs_platforms_title: string;
  jobs_platforms_desc: string;
  jobs_platforms_covered: string;
  jobs_open_positions_title: string;
  jobs_found_count: string;
  jobs_cached_badge: string;
  jobs_filter_remote_btn: string;
  jobs_filter_min_score_aria: string;
  jobs_filter_score_all: string;
  jobs_filter_score_60: string;
  jobs_filter_score_80: string;
  jobs_filter_source_aria: string;
  jobs_filter_source_all: string;
  jobs_sort_aria: string;
  jobs_sort_score: string;
  jobs_sort_date: string;
  jobs_searching_status: string;
  jobs_match_strong: string;
  jobs_match_good: string;
  jobs_match_partial: string;
  jobs_match_label: string;
  jobs_why_matches_btn: string;
  jobs_matched_skills_label: string;
  jobs_missing_skills_label: string;
  jobs_source_label: string;
  jobs_tailor_cover_btn: string;
  jobs_view_on_source: string;
  jobs_attributions_title: string;

  // Hero & Landing Mockup Complete i18n
  hero_preview_parser_ready: string;
  hero_preview_ats_passed: string;
  hero_preview_ats_short: string;
  hero_preview_ats_score_aria: string;
  hero_preview_email: string;
  hero_preview_phone: string;
  hero_preview_location: string;
  hero_preview_kw1: string;
  hero_preview_kw2: string;
  hero_preview_kw3: string;
  hero_preview_kw4: string;
  hero_preview_kw5: string;
  landing_err_unreadable_file: string;
  landing_err_parse_failed: string;
  landing_jsonld_desc: string;

  // Common Copy & Responsive Layout / Crypto / AppShell i18n
  crypto_title: string;
  crypto_step1: string;
  crypto_step2: string;
  crypto_step3: string;
  crypto_step4: string;
  crypto_exact_amount_warning: string;
  crypto_network_warning: string;
  crypto_txid_placeholder: string;
  crypto_verify_btn: string;
  crypto_verifying: string;
  crypto_pending_title: string;
  crypto_pending_desc: string;
  crypto_expired_title: string;
  crypto_expired_desc: string;
  crypto_restart_btn: string;
  crypto_copy_address: string;
  crypto_copy_amount: string;
  crypto_copy_txid: string;
  crypto_copy_ref: string;
  crypto_loading: string;
  crypto_not_found_title: string;
  crypto_not_found_desc: string;
  crypto_select_network: string;
  crypto_lowest_fee: string;
  crypto_standard_fee: string;
  crypto_exact_amount_label: string;
  crypto_deposit_wallet_label: string;
  crypto_payment_steps_title: string;
  crypto_submit_txid_title: string;
  crypto_submit_txid_desc: string;
  crypto_secure_verification: string;
  shell_sidebar_aria: string;
  shell_demo_active: string;
  shell_demo_sub: string;
  shell_ai_credits: string;
  shell_expand_sidebar: string;
  shell_collapse_sidebar: string;
  shell_collapse_label: string;
  shell_skip_content: string;
  shell_open_menu: string;
  shell_close_menu: string;
  shell_workspace_heading: string;
  shell_more: string;
  shell_bottom_nav_aria: string;
  shell_user_menu_aria: string;
  shell_breadcrumb_aria: string;
  dashboard_generate_ai_btn: string;
  dashboard_copy_email: string;

  // Navbar Redesign & Accessibility i18n
  nav_features: string;
  nav_jobs: string;
  nav_login_btn: string;
  nav_start_free: string;
  nav_billing: string;
  nav_settings: string;
  nav_main_aria: string;
  nav_mobile_drawer_aria: string;
  nav_home_aria: string;
  nav_change_language_aria: string;
  nav_language_options_aria: string;
  nav_theme_light: string;
  nav_theme_dark: string;
  nav_theme_system: string;
  nav_theme_switcher_aria: string;
}

