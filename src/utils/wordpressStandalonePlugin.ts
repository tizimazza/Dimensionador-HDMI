import { INITIAL_SIZING_CONFIG } from '../data/sizingConfig';

export function generateWordPressPlugin(): string {
  const defaultSkus = JSON.stringify(INITIAL_SIZING_CONFIG.skuDictionary);
  
  return `<?php
/**
 * Plugin Name: Dimensionador HDMI
 * Description: Sistema interativo em formato de Wizard para dimensionamento de cabos HDMI, extensores e switches. (Uso via Shortcode [dimensionador_hdmi])
 * Version: 15.0.0
 * Author: Discabos
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. AJAX Endpoint for Product Data
add_action('wp_ajax_discabos_get_skus', 'discabos_av_get_skus_ajax');
add_action('wp_ajax_nopriv_discabos_get_skus', 'discabos_av_get_skus_ajax');

function discabos_av_get_skus_ajax() {
    ob_start();
    
    if (!class_exists('WooCommerce')) {
        ob_clean();
        wp_send_json_error('WooCommerce não está instalado/ativo.');
        wp_die();
    }

    $skus = isset($_POST['skus']) ? json_decode(stripslashes($_POST['skus']), true) : [];
    $result = array();
    $debug = array();

    if (!empty($skus) && is_array($skus)) {
        foreach ($skus as $sku) {
            $clean_sku = trim($sku);
            $product_id = wc_get_product_id_by_sku($clean_sku);
            
            // Fallback nativo: busca direta no banco caso o WooCommerce falhe no cache do SKU ou seja variação
            if (!$product_id) {
                global $wpdb;
                $product_id = $wpdb->get_var($wpdb->prepare("SELECT post_id FROM $wpdb->postmeta WHERE meta_key='_sku' AND meta_value='%s' LIMIT 1", $clean_sku));
            }

            // Fallback caso o usuário tenha inserido o ID do Post
            if (!$product_id && is_numeric($clean_sku)) {
                $test_product = wc_get_product($clean_sku);
                if ($test_product) {
                    $product_id = $clean_sku;
                }
            }

            if ($product_id) {
                $product = wc_get_product($product_id);
                if ($product) {
                    $img_url = wp_get_attachment_image_url($product->get_image_id(), 'thumbnail');
                    
                    // Fallback para pegar a foto do produto pai caso seja uma variação sem imagem
                    if (!$img_url && $product->is_type('variation')) {
                        $parent_id = $product->get_parent_id();
                        $img_url = wp_get_attachment_image_url(get_post_thumbnail_id($parent_id), 'thumbnail');
                    }

                    // Puxar as categorias reais do produto no WooCommerce
                    $cats = wc_get_product_terms($product->get_id(), 'product_cat', array('fields' => 'names'));
                    if (empty($cats) && $product->is_type('variation')) {
                        $cats = wc_get_product_terms($product->get_parent_id(), 'product_cat', array('fields' => 'names'));
                    }
                    $cat_string = (!empty($cats) && !is_wp_error($cats)) ? implode(', ', $cats) : '';

                    $result[$sku] = array(
                        'id' => $product->get_id(),
                        'name' => $product->get_name(),
                        'url' => $product->get_permalink(),
                        'image' => $img_url ? $img_url : '', // Se vazio, frontend vai gerar placeholder
                        'real_category' => $cat_string
                    );
                    $debug[$sku] = "Encontrado (ID: " . $product->get_id() . ")";
                } else {
                    $debug[$sku] = "Produto nulo após buscar ID: " . $product_id;
                }
            } else {
                $debug[$sku] = "Nenhum ID encontrado para o SKU fornecido.";
            }
        }
    }
    
    ob_clean();
    wp_send_json_success(array('products' => $result, 'debug' => $debug));
    wp_die();
}

// Set HTML content type for wp_mail (compatível com POST SMTP)
function discabos_set_html_content_type() {
    return 'text/html';
}

// Endpoint para envio de email
add_action('wp_ajax_discabos_send_email', 'discabos_send_email_ajax');
add_action('wp_ajax_nopriv_discabos_send_email', 'discabos_send_email_ajax');

function discabos_send_email_ajax() {
    ob_start();
    
    if (!is_user_logged_in()) {
        ob_clean();
        wp_send_json_error('Por favor, faça login no site para receber o relatório por e-mail.');
        wp_die();
    }

    $user = wp_get_current_user();
    $to = $user->user_email;
    $site_name = get_bloginfo('name');
    
    // Logo
    $logo_url = '';
    $custom_logo_id = get_theme_mod('custom_logo');
    if ($custom_logo_id) {
        $logo_url = wp_get_attachment_image_url($custom_logo_id, 'full');
    }
    
    // Payload from JS
    $bom = isset($_POST['bom']) ? json_decode(stripslashes($_POST['bom']), true) : [];
    $products = isset($_POST['products']) ? json_decode(stripslashes($_POST['products']), true) : [];
    $archName = isset($_POST['archName']) ? sanitize_text_field($_POST['archName']) : '';
    $archDesc = isset($_POST['archDesc']) ? sanitize_text_field($_POST['archDesc']) : '';
    $reasoning = isset($_POST['reasoning']) ? sanitize_text_field($_POST['reasoning']) : '';
    $sources = isset($_POST['sources']) ? sanitize_text_field($_POST['sources']) : '';
    $displays = isset($_POST['displays']) ? sanitize_text_field($_POST['displays']) : '';
    $dist = isset($_POST['dist']) ? sanitize_text_field($_POST['dist']) : '';
    $resLabel = isset($_POST['resLabel']) ? sanitize_text_field($_POST['resLabel']) : '';
    $eqName = isset($_POST['eqName']) ? sanitize_text_field($_POST['eqName']) : '';
    $hasIp = isset($_POST['hasIp']) && $_POST['hasIp'] === '1';
    $hasHdbaset = isset($_POST['hasHdbaset']) && $_POST['hasHdbaset'] === '1';
    
    $main_color = get_option('dimensionador_hdmi_main_color', '#DF1319');
    
    $subject = 'Relatório de Dimensionamento HDMI - ' . $site_name;
    
    // Start Email HTML
    $message = '<div style="font-family: Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">';
    
    // Header with Logo
    if ($logo_url) {
        $message .= '<div style="background: #f8fafc; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">';
        $message .= '<img src="' . esc_url($logo_url) . '" alt="' . esc_attr($site_name) . '" style="max-height: 60px;" />';
        $message .= '</div>';
    }
    
    // Body Content
    $message .= '<div style="padding: 24px;">';
    $message .= '<h2 style="color: ' . esc_attr($main_color) . '; margin-top: 0;">Solução Recomendada</h2>';
    
    // Project Summary
    $message .= '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">';
    $message .= '<h4 style="margin: 0 0 12px 0; font-size: 16px; color: #334155;">Resumo do Projeto</h4>';
    $message .= '<div style="font-size: 14px; color: #475569;">';
    $message .= '<strong>Fontes:</strong> ' . $sources . ' | ';
    $message .= '<strong>Telas:</strong> ' . $displays . ' | ';
    $message .= '<strong>Distância:</strong> ' . $dist . 'm | ';
    $message .= '<strong>Resolução:</strong> ' . $resLabel;
    $message .= '</div></div>';
    
    $message .= '<p style="font-size: 16px; color: #334155; font-weight: bold; margin-bottom: 8px;">' . $archName . '</p>';
    $message .= '<p style="color: #334155; margin-bottom: 8px; font-weight: 500;">' . $archDesc . '</p>';
    $message .= '<p style="color: #64748b; font-style: italic; margin-bottom: 24px;">' . $reasoning . '</p>';
    
    // Diagrama
    $message .= '<h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px; color: #334155;">Diagrama da Solução</h3>';
    $message .= '<div style="background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 32px; text-align: center; overflow-x: auto;">';
    $message .= '<table style="margin: 0 auto; border-collapse: collapse; min-width: 300px;"><tr>';

    // FONTES
    $message .= '<td style="vertical-align: middle; padding: 0 10px;">';
    $dCountSources = min(intval($sources), 4);
    for ($i = 0; $i < $dCountSources; $i++) {
        $message .= '<div style="background: #0f172a; color: white; padding: 8px 16px; border-radius: 6px; margin-bottom: '.($i < $dCountSources-1 ? '8px' : '0').'; font-size: 12px; font-weight: bold; white-space: nowrap;">Fonte ' . ($i+1) . '</div>';
    }
    if (intval($sources) > 4) {
        $message .= '<div style="font-size: 10px; color: #64748b; margin-top: 4px;">+ ' . (intval($sources)-4) . '</div>';
    }
    $message .= '</td>';

    // LINHA 1
    $message .= '<td style="vertical-align: middle; padding: 0;"><div style="width: 20px; height: 2px; background: #cbd5e1;"></div></td>';

    // EQUIPAMENTO CENTRAL
    $message .= '<td style="vertical-align: middle; padding: 0 10px;">';
    if ($hasIp) {
        $message .= '<div style="background: ' . esc_attr($main_color) . '; color: white; padding: 16px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">Switch<br/>Gigabit</div>';
    } else {
        $message .= '<div style="background: ' . esc_attr($main_color) . '; color: white; padding: 16px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">' . $eqName . '</div>';
    }
    $message .= '</td>';

    // HDBASET
    if ($hasHdbaset) {
        $message .= '<td style="vertical-align: middle; padding: 0;"><div style="width: 20px; height: 2px; background: #cbd5e1;"></div></td>';
        $message .= '<td style="vertical-align: middle; padding: 0 10px;">';
        $message .= '<div style="background: ' . esc_attr($main_color) . '; color: white; padding: 16px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">Extensores<br/>HDBaseT</div>';
        $message .= '</td>';
    }

    // LINHA 2
    $message .= '<td style="vertical-align: middle; padding: 0;"><div style="width: 20px; height: 2px; background: #cbd5e1;"></div></td>';

    // TELAS
    $message .= '<td style="vertical-align: middle; padding: 0 10px;">';
    $dCountDisplays = min(intval($displays), 4);
    for ($i = 0; $i < $dCountDisplays; $i++) {
        $message .= '<div style="background: #334155; color: white; padding: 8px 16px; border-radius: 6px; margin-bottom: '.($i < $dCountDisplays-1 ? '8px' : '0').'; font-size: 12px; font-weight: bold; white-space: nowrap;">Tela ' . ($i+1) . '</div>';
    }
    if (intval($displays) > 4) {
        $message .= '<div style="font-size: 10px; color: #64748b; margin-top: 4px;">+ ' . (intval($displays)-4) . '</div>';
    }
    $message .= '</td>';

    $message .= '</tr></table>';
    $message .= '</div>';
    
    $message .= '<h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; color: #334155;">Lista de Materiais (BOM)</h3>';
    
    $message .= '<table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">';
    foreach ($bom as $item) {
        $sku = $item['sku'];
        $p = isset($products[$sku]) ? $products[$sku] : null;
        
        $img = ($p && !empty($p['image'])) ? '<img src="' . esc_url($p['image']) . '" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; border: 1px solid #e2e8f0;" />' : '<div style="width: 50px; height: 50px; background: #f1f5f9; border-radius: 4px; border: 1px solid #e2e8f0;"></div>';
        $cat = ($p && !empty($p['real_category'])) ? $p['real_category'] : $item['cat'];
        $name = $item['name'];
        if ($sku === 'GEN-SWITCH') {
            $cat = '';
        }
        
        $message .= '<tr>';
        $message .= '<td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; width: 60px;">' . $img . '</td>';
        $message .= '<td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0;">';
        $message .= '<div style="font-weight: bold; color: #334155;">' . $name . '</div>';
        $message .= '<div style="font-size: 12px; color: #64748b;">SKU: ' . $sku . ' ' . (!empty($cat) ? ' | Categoria: ' . $cat : '') . '</div>';
        if ($sku === 'GEN-SWITCH') {
            $message .= '<div style="font-size: 12px; color: ' . esc_attr($main_color) . '; margin-top: 4px;">Este item não é comercializado pela Discabos, mas é necessário para a solução.</div>';
        }
        $message .= '</td>';
        $message .= '<td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">' . $item['qty'] . '</td>';
        $message .= '</tr>';
    }
    $message .= '</table>';
    
    // Custom Signature Footer
    $message .= '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />';
    $message .= '<div style="color: #475569; font-size: 14px;">';
    $message .= '<strong>Grupo Discabos</strong><br/>';
    $message .= '(11) 4138-8373 (WhatsApp e Telefone)<br/>';
    $message .= '<a href="mailto:vendas@discabos.com.br" style="color: ' . esc_attr($main_color) . ';">vendas@discabos.com.br</a>';
    $message .= '</div>';
    
    $message .= '</div></div>';
    
    $headers = array();
    
    // Adiciona CC se configurado no painel Admin
    $cc_email = get_option('dimensionador_hdmi_cc_email', '');
    if (!empty($cc_email) && is_email($cc_email)) {
        $headers[] = 'Cc: ' . sanitize_email($cc_email);
    }
    
    add_filter('wp_mail_content_type', 'discabos_set_html_content_type');
    $sent = wp_mail($to, $subject, $message, $headers);
    remove_filter('wp_mail_content_type', 'discabos_set_html_content_type');
    
    ob_clean();
    if ($sent) {
        wp_send_json_success('E-mail enviado com sucesso para ' . $to . (!empty($cc_email) ? ' (com cópia)' : ''));
    } else {
        wp_send_json_error('Falha no envio de e-mail (wp_mail retornou false). Verifique seu plugin SMTP (ex: POST SMTP).');
    }
    wp_die();
}

// 2. Painel Admin (Configurações)
add_action('admin_menu', 'dimensionador_hdmi_menu');
function dimensionador_hdmi_menu() {
    add_menu_page(
        'Dimensionador HDMI',
        'Dimensionador HDMI',
        'manage_options',
        'dimensionador-hdmi',
        'dimensionador_hdmi_admin_page',
        'dashicons-feedback'
    );
}

add_action('admin_init', 'dimensionador_hdmi_settings');
function dimensionador_hdmi_settings() {
    register_setting('dimensionador_hdmi_settings', 'dimensionador_hdmi_skus');
    register_setting('dimensionador_hdmi_settings', 'dimensionador_hdmi_cc_email');
    register_setting('dimensionador_hdmi_settings', 'dimensionador_hdmi_main_color');
    register_setting('dimensionador_hdmi_settings', 'dimensionador_hdmi_button_color');
}

function dh_input_html($key, $label, $skus) {
    $val = esc_attr(isset($skus[$key]) ? $skus[$key] : '');
    return '<div style="margin-bottom: 12px;"><label style="display:block; font-weight:600; margin-bottom:4px; font-size:13px;">' . esc_html($label) . '</label><input type="text" style="width:100%; max-width:100%; padding: 4px 8px;" name="dimensionador_hdmi_skus[' . esc_attr($key) . ']" value="' . $val . '" /></div>';
}

function dimensionador_hdmi_admin_page() {
    $default_skus = json_decode('${defaultSkus}', true);
    $skus = get_option('dimensionador_hdmi_skus', $default_skus);
    if (!is_array($skus)) $skus = $default_skus;
    $skus = wp_parse_args($skus, $default_skus);
    
    $cc_email = get_option('dimensionador_hdmi_cc_email', '');
    $main_color = get_option('dimensionador_hdmi_main_color', '#DF1319');
    $button_color = get_option('dimensionador_hdmi_button_color', '#9ebf24');
    ?>
    <div class="wrap">
        <h1 style="margin-bottom: 20px;">Dimensionador HDMI - Configurações</h1>
        <form method="post" action="options.php">
            <?php settings_fields('dimensionador_hdmi_settings'); ?>
            
            <div style="background: #fff; border: 1px solid #ccd0d4; padding: 20px; box-shadow: 0 1px 1px rgba(0,0,0,.04); max-width: 1200px; margin-bottom: 20px;">
                <h2 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Identidade Visual & E-mail</h2>
                <div style="display: flex; gap: 40px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin-top: 0;">Cores do Plugin</h3>
                        <p style="color:#666; font-size: 13px;">Defina as cores para combinar com o seu tema.</p>
                        <div style="margin-bottom: 12px;">
                            <label style="display:block; font-weight:600; margin-bottom:4px; font-size:13px;">Cor Principal (Bordas/Destaques)</label>
                            <input type="color" name="dimensionador_hdmi_main_color" value="<?php echo esc_attr($main_color); ?>" />
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="display:block; font-weight:600; margin-bottom:4px; font-size:13px;">Cor dos Botões (Avançar/Adicionar/Email)</label>
                            <input type="color" name="dimensionador_hdmi_button_color" value="<?php echo esc_attr($button_color); ?>" />
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin-top: 0;">E-mail do Administrador</h3>
                        <p style="color:#666; font-size: 13px;">Configure um e-mail para receber cópia (CC) dos relatórios.</p>
                        <div style="margin-bottom: 12px;">
                            <label style="display:block; font-weight:600; margin-bottom:4px; font-size:13px;">E-mail em Cópia (CC)</label>
                            <input type="email" style="width:100%; max-width:400px; padding: 4px 8px;" name="dimensionador_hdmi_cc_email" value="<?php echo esc_attr($cc_email); ?>" placeholder="exemplo@seudominio.com.br" />
                        </div>
                    </div>
                </div>
            </div>

            <p>Configure os SKUs exatos (ou o ID do Produto) do WooCommerce que o assistente utilizará para cada cenário.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; max-width: 1200px;">
                
                <div style="background: #fff; border: 1px solid #ccd0d4; padding: 20px; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
                    <h2 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Equipamentos de Distribuição</h2>
                    <?php echo dh_input_html('splitter_1x2', 'Splitter 1x2 (4K)', $skus); ?>
                    <?php echo dh_input_html('splitter_1x4', 'Splitter 1x4 (4K)', $skus); ?>
                    <?php echo dh_input_html('matrix_4x4', 'Matriz 4x4 (4K)', $skus); ?>
                    <?php echo dh_input_html('matrix_8x8', 'Matriz 8x8 (4K)', $skus); ?>
                </div>

                <div style="background: #fff; border: 1px solid #ccd0d4; padding: 20px; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
                    <h2 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Cenários 1080p</h2>
                    <?php echo dh_input_html('cable_1080p_1m', 'Cabo HDMI 1080p (1m)', $skus); ?>
                    <?php echo dh_input_html('cable_1080p_3m', 'Cabo HDMI 1080p (3m)', $skus); ?>
                    <?php echo dh_input_html('cable_1080p_5m', 'Cabo HDMI 1080p (5m)', $skus); ?>
                    <?php echo dh_input_html('cable_1080p_10m', 'Cabo HDMI 1080p (10m)', $skus); ?>
                    <?php echo dh_input_html('cable_1080p_15m', 'Cabo HDMI 1080p (15m)', $skus); ?>
                    
                    <h3 style="margin-top:20px; font-size:14px; color:#555;">Extensores IP (> 15m)</h3>
                    <div style="display:flex; gap: 10px;">
                        <div style="flex:1;"><?php echo dh_input_html('espo_tx', 'TX ESPO', $skus); ?></div>
                        <div style="flex:1;"><?php echo dh_input_html('espo_rx', 'RX ESPO', $skus); ?></div>
                    </div>
                    <div style="display:flex; gap: 10px;">
                        <div style="flex:1;"><?php echo dh_input_html('nesc_tx', 'TX NESC', $skus); ?></div>
                        <div style="flex:1;"><?php echo dh_input_html('nesc_rx', 'RX NESC', $skus); ?></div>
                    </div>
                </div>

                <div style="background: #fff; border: 1px solid #ccd0d4; padding: 20px; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
                    <h2 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Cenários 4K</h2>
                    <?php echo dh_input_html('cable_4k_1m', 'Cabo HDMI 4K (1m)', $skus); ?>
                    <?php echo dh_input_html('cable_4k_3m', 'Cabo HDMI 4K (3m)', $skus); ?>
                    <?php echo dh_input_html('cable_4k_5m', 'Cabo HDMI 4K (5m)', $skus); ?>
                    
                    <h3 style="margin-top:20px; font-size:14px; color:#555;">Cabos Fibra Óptica 4K (Distâncias Longas)</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <?php echo dh_input_html('fiber_4k_10m', '10m', $skus); ?>
                        <?php echo dh_input_html('fiber_4k_15m', '15m', $skus); ?>
                        <?php echo dh_input_html('fiber_4k_20m', '20m', $skus); ?>
                        <?php echo dh_input_html('fiber_4k_30m', '30m', $skus); ?>
                        <?php echo dh_input_html('fiber_4k_50m', '50m', $skus); ?>
                        <?php echo dh_input_html('fiber_4k_100m', '100m', $skus); ?>
                    </div>

                    <h3 style="margin-top:20px; font-size:14px; color:#555;">Extensores HDBaseT (Para Comutação 4K > 5m)</h3>
                    <?php echo dh_input_html('hdbaset_70m', 'Extensor 70m (Até 40m em 4K)', $skus); ?>
                    <?php echo dh_input_html('hdbaset_150m', 'Extensor 150m (Até 120m em 4K)', $skus); ?>
                </div>

                <div style="background: #fff; border: 1px solid #ccd0d4; padding: 20px; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
                    <h2 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Cenários 8K</h2>
                    <?php echo dh_input_html('fiber_8k_3m', 'Cabo Fibra 8K (3m)', $skus); ?>
                    <?php echo dh_input_html('fiber_8k_10m', 'Cabo Fibra 8K (10m)', $skus); ?>
                    <?php echo dh_input_html('fiber_8k_15m', 'Cabo Fibra 8K (15m)', $skus); ?>
                    <?php echo dh_input_html('fiber_8k_20m', 'Cabo Fibra 8K (20m)', $skus); ?>
                    <?php echo dh_input_html('fiber_8k_50m', 'Cabo Fibra 8K (50m)', $skus); ?>
                    
                    <h2 style="margin-top:30px; border-bottom:1px solid #eee; padding-bottom:10px;">Infraestrutura Base</h2>
                    <?php echo dh_input_html('short_hdmi', 'Cabo HDMI Curto (Para TX/RX/Matriz)', $skus); ?>
                    <?php echo dh_input_html('cat6_meter', 'Cabo de Rede Cat6 (Metro)', $skus); ?>
                    <?php echo dh_input_html('switch_gigabit', 'Switch de Rede Gigabit (Para IP)', $skus); ?>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <?php submit_button('Salvar Configurações', 'primary', 'submit', false); ?>
            </div>
        </form>
    </div>
    <?php
}

// 3. Shortcode & Frontend Script Registration
add_shortcode('dimensionador_hdmi', 'discabos_av_calculator_shortcode');

function discabos_av_calculator_shortcode() {
    $ajax_url = admin_url('admin-ajax.php');
    $cart_url = function_exists('wc_get_cart_url') ? wc_get_cart_url() : home_url('/carrinho/');
    
    $default_skus = json_decode('${defaultSkus}', true);
    $saved_skus = get_option('dimensionador_hdmi_skus', $default_skus);
    if (!is_array($saved_skus)) $saved_skus = $default_skus;
    $final_skus = wp_parse_args($saved_skus, $default_skus);
    $skus_json = json_encode($final_skus);

    $main_color = get_option('dimensionador_hdmi_main_color', '#DF1319');
    $button_color = get_option('dimensionador_hdmi_button_color', '#9ebf24');

    ob_start();
    ?>
    <style>
      #ds-app, #ds-app * {
        font-family: "Nunito", sans-serif !important;
        box-sizing: border-box;
      }
      #ds-app {
        --ds-main: <?php echo esc_attr($main_color); ?>;
        --ds-btn: <?php echo esc_attr($button_color); ?>;
        color: #334155;
        background: transparent;
        padding: 0;
        width: 100%;
      }
      .ds-card { background: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e2e8f0; width: 100%; max-width: 100%; }
      
      /* Stepper */
      .ds-stepper { display: flex; gap: 8px; margin-bottom: 24px; padding: 24px 32px 0 32px; overflow-x: auto; width: 100%; }
      .ds-step-dot { flex: 1; text-align: center; font-size: 16px; font-weight: bold; color: #94a3b8; padding: 12px; border-bottom: 4px solid #e2e8f0; transition: 0.3s; white-space: nowrap; }
      .ds-step-dot.active { color: var(--ds-main); border-bottom-color: var(--ds-main); }
      .ds-step-dot.completed { color: #1e293b; border-bottom-color: #1e293b; }

      .ds-body { padding: 0 32px 32px 32px; min-height: 400px; width: 100%; }
      .ds-step { display: none; animation: dsFadeIn 0.5s ease-in-out; }
      .ds-step.active { display: block; }
      @keyframes dsFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .ds-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      @media (max-width: 600px) { .ds-grid { grid-template-columns: 1fr; } }
      .ds-input-group { background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; }
      .ds-label { display: block; font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #334155; }
      .ds-input { width: 100%; padding: 12px; font-size: 18px; border: 1px solid #cbd5e1; border-radius: 6px; }
      .ds-radio-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
      .ds-radio-label { display: block; padding: 12px; text-align: center; border: 2px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
      .ds-radio-input { display: none; }
      .ds-radio-input:checked + .ds-radio-label { border-color: var(--ds-main); background: #f1f5f9; color: var(--ds-main); }
      .ds-footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; width: 100%; }
      .ds-btn { padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; font-size: 16px; transition: 0.2s; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
      .ds-btn-prev { background: transparent; color: #475569; border: 1px solid #cbd5e1; }
      .ds-btn-prev:hover { background: #e2e8f0; }
      .ds-btn-next { background: var(--ds-btn); color: white; }
      .ds-btn-next:hover { opacity: 0.9; }
      .ds-btn-calc { background: var(--ds-btn); color: white; }
      .ds-btn-calc:hover { opacity: 0.9; }
      .ds-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      
      .ds-table-container { overflow-x: auto; margin-top: 24px; border: 1px solid #e2e8f0; border-radius: 8px; width: 100%; }
      .ds-table { width: 100%; border-collapse: collapse; text-align: left; }
      .ds-table th, .ds-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      .ds-table th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #64748b; }
      .ds-product-img { width: 64px; height: 64px; border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0; }
      .ds-bom-actions { display: flex; flex-direction: column; gap: 8px; }
      @media (max-width: 768px) {
        .ds-stepper { flex-wrap: wrap; gap: 8px; padding: 12px; }
        .ds-step-dot { flex: 1 1 45%; text-align: center; font-size: 12px; padding: 6px; }
        .ds-body { padding: 16px; }
        .ds-radio-grid { grid-template-columns: 1fr; }
        .ds-footer { flex-direction: column; gap: 12px; padding: 16px; }
        .ds-btn { width: 100%; justify-content: center; }
        .ds-table th, .ds-table td { padding: 8px; font-size: 13px; }
        .ds-product-img { width: 48px; height: 48px; }
      }
    </style>

    <div id="ds-app">
      <div class="ds-card">
        
        <div class="ds-stepper">
          <div id="ds-indicator-1" class="ds-step-dot active">1. Parâmetros do Projeto</div>
          <div id="ds-indicator-2" class="ds-step-dot">2. Solução Recomendada</div>
        </div>

        <div class="ds-body">
          <!-- STEP 1 -->
          <div id="ds-step-1" class="ds-step active">
            <!-- Equipamentos -->
            <h3 style="font-size: 20px; margin-bottom: 8px; margin-top:0; color: var(--ds-main);">Equipamentos</h3>
            <p style="color: #64748b; margin-bottom: 16px;">Defina a quantidade de fontes e de telas.</p>
            <div class="ds-grid" style="margin-bottom: 32px;">
              <div class="ds-input-group">
                <label class="ds-label">Qtd. de Fontes (Inputs)</label>
                <input type="number" id="ds-sources" class="ds-input" value="1" min="1" max="64">
              </div>
              <div class="ds-input-group">
                <label class="ds-label">Qtd. de Telas (Outputs)</label>
                <input type="number" id="ds-displays" class="ds-input" value="1" min="1" max="64">
              </div>
            </div>

            <!-- Distância -->
            <h3 style="font-size: 20px; margin-bottom: 8px; margin-top:0; color: var(--ds-main);">Distância</h3>
            <div class="ds-input-group" style="max-width: 400px; margin-bottom: 32px;">
              <label class="ds-label">Distância Máxima (metros)</label>
              <input type="number" id="ds-distance" class="ds-input" value="15" min="1" max="150">
            </div>

            <!-- Resolução -->
            <h3 style="font-size: 20px; margin-bottom: 16px; margin-top:0; color: var(--ds-main);">Resolução</h3>
            <div class="ds-radio-grid">
              <div>
                <input type="radio" name="ds-res" id="res-1080p" class="ds-radio-input" value="1080p">
                <label for="res-1080p" class="ds-radio-label">Full HD (1080p)</label>
              </div>
              <div>
                <input type="radio" name="ds-res" id="res-4k" class="ds-radio-input" value="4k" checked>
                <label for="res-4k" class="ds-radio-label">4K UHD</label>
              </div>
              <div>
                <input type="radio" name="ds-res" id="res-8k" class="ds-radio-input" value="8k">
                <label for="res-8k" class="ds-radio-label">8K</label>
              </div>
            </div>
          </div>

          <!-- STEP 2 (RESULTS) -->
          <div id="ds-step-2" class="ds-step">
            <h3 style="font-size: 24px; margin-top:0; color: var(--ds-main); font-weight: bold; margin-bottom: 8px;">Solução Recomendada</h3>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #334155;">Resumo do Projeto</h4>
                <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 14px; color: #475569;">
                    <div><strong>Fontes:</strong> <span id="ds-sum-sources"></span></div>
                    <div><strong>Telas:</strong> <span id="ds-sum-displays"></span></div>
                    <div><strong>Distância:</strong> <span id="ds-sum-dist"></span>m</div>
                    <div><strong>Resolução:</strong> <span id="ds-sum-res"></span></div>
                </div>
            </div>

            <p id="ds-arch-desc" style="font-size: 16px; color: #334155; margin-bottom: 8px; font-weight: 500;"></p>
            <p id="ds-reasoning" style="color: #64748b; margin-bottom: 24px; font-style: italic;"></p>
            
            <div id="ds-diagram-container" style="margin-bottom: 32px;"></div>

            <div class="ds-table-container">
              <table class="ds-table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Produto</th>
                    <th>SKU</th>
                    <th>Categoria</th>
                    <th style="text-align:center;">Qtd</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody id="ds-bom-body"></tbody>
              </table>
            </div>

            <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
              <button id="ds-btn-email" class="ds-btn ds-btn-calc" style="display:flex; align-items:center; gap:8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Enviar Relatório para meu Email
              </button>
              <span id="ds-email-feedback" style="font-size: 14px; font-weight: bold;"></span>
            </div>
          </div>
        </div>

        <div class="ds-footer">
          <button id="ds-btn-prev" class="ds-btn ds-btn-prev" style="visibility: hidden;">Voltar</button>
          <button id="ds-btn-next" class="ds-btn ds-btn-next">Avançar</button>
        </div>
      </div>
    </div>

    <script>
      (function() {
        var step = 1;
        var skus = <?php echo $skus_json; ?>;
        var ajaxUrl = "<?php echo $ajax_url; ?>";
        var cartUrl = "<?php echo esc_url($cart_url); ?>";
        var currentData = null; 

        var btnPrev = document.getElementById('ds-btn-prev');
        var btnNext = document.getElementById('ds-btn-next');
        var btnEmail = document.getElementById('ds-btn-email');
        
        function updateSteps() {
          document.querySelectorAll('.ds-step').forEach(function(el, i) {
            el.classList.toggle('active', i + 1 === step);
          });
          
          for(var j=1; j<=2; j++) {
            var ind = document.getElementById('ds-indicator-'+j);
            if(j === step) {
                ind.className = 'ds-step-dot active';
            } else if (j < step) {
                ind.className = 'ds-step-dot completed';
            } else {
                ind.className = 'ds-step-dot';
            }
          }

          btnPrev.style.display = 'none'; // Not needed anymore since there's no previous step to go back to natively
          
          if (step === 1) {
            btnNext.innerText = 'Dimensionar Solução';
            btnNext.className = 'ds-btn ds-btn-calc';
          } else if (step === 2) {
            btnNext.innerText = 'Refazer Dimensionamento';
            btnNext.className = 'ds-btn ds-btn-prev';
          }
        }

        btnPrev.addEventListener('click', function() {
          // not used
        });

        btnNext.addEventListener('click', function() {
          if (step === 1) {
            calculateAndFetch();
          } else if (step === 2) {
            step = 1;
            updateSteps();
          }
        });

        btnEmail.addEventListener('click', function() {
          if(!currentData) return;
          var btn = this;
          var feedback = document.getElementById('ds-email-feedback');
          btn.disabled = true;
          btn.innerHTML = 'Enviando...';
          feedback.innerText = '';
          
          var formData = new URLSearchParams();
          formData.append('action', 'discabos_send_email');
          formData.append('bom', JSON.stringify(currentData.bom));
          formData.append('products', JSON.stringify(currentData.products || {}));
          formData.append('archName', currentData.archName);
          formData.append('archDesc', currentData.archDesc);
          formData.append('reasoning', currentData.reasoning);
          formData.append('sources', currentData.sources);
          formData.append('displays', currentData.displays);
          formData.append('dist', currentData.dist);
          formData.append('resLabel', currentData.resLabel);
          formData.append('eqName', currentData.eqName);
          formData.append('hasIp', currentData.hasIp ? '1' : '0');
          formData.append('hasHdbaset', currentData.hasHdbaset ? '1' : '0');

          fetch(ajaxUrl, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          })
          .then(res => res.text())
          .then(text => {
            try {
              return JSON.parse(text);
            } catch(e) {
              throw new Error("Erro ao interpretar resposta do servidor: " + text.substring(0, 100));
            }
          })
          .then(data => {
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Enviar Relatório para meu Email';
            btn.disabled = false;
            if (data.success) {
                feedback.style.color = '#16a34a';
                feedback.innerText = '✓ ' + data.data;
            } else {
                feedback.style.color = '#DF1319';
                feedback.innerText = '✖ ' + data.data;
            }
          })
          .catch(err => {
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Enviar Relatório para meu Email';
            btn.disabled = false;
            feedback.style.color = '#DF1319';
            feedback.innerText = '✖ Erro de conexão ao enviar o e-mail.';
          });
        });

        function getClosestLength(dist, arr) {
          for(var i=0; i<arr.length; i++) {
            if(arr[i] >= dist) return arr[i];
          }
          return arr[arr.length-1];
        }

        function renderDiagramHtml(sources, displays, eqName, hasIp, hasHdbaset) {
            var html = '<div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto;">';
            
            // Coluna Fontes
            html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
            var sCount = Math.min(sources, 4);
            for(var i=0; i<sCount; i++) html += '<div style="background: white; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); white-space: nowrap;">Fonte de Vídeo</div>';
            if(sources > 4) html += '<div style="font-size: 12px; text-align: center; color: #64748b; font-weight: bold;">+ '+(sources-4)+'</div>';
            html += '</div>';

            html += '<div style="flex: 1; height: 2px; background: #cbd5e1; min-width: 20px;"></div>';

            // Equipamento Central
            if (eqName) {
                html += '<div style="background: #0f172a; color: white; border: none; padding: 16px 24px; border-radius: 8px; font-weight: bold; text-align: center; max-width: 180px;">' + eqName + '</div>';
                html += '<div style="flex: 1; height: 2px; background: #cbd5e1; min-width: 20px;"></div>';
            }

            // HDBaseT
            if (hasHdbaset) {
                html += '<div style="background: var(--ds-main); color: white; border: none; padding: 16px 24px; border-radius: 8px; font-weight: bold; text-align: center; max-width: 180px;">Extensores<br/>HDBaseT</div>';
                html += '<div style="flex: 1; height: 2px; background: #cbd5e1; min-width: 20px;"></div>';
            }

            // Coluna Telas
            html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
            var dCount = Math.min(displays, 4);
            for(var i=0; i<dCount; i++) html += '<div style="background: white; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: bold; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); white-space: nowrap;">Tela / Projetor</div>';
            if(displays > 4) html += '<div style="font-size: 12px; text-align: center; color: #64748b; font-weight: bold;">+ '+(displays-4)+'</div>';
            html += '</div>';

            html += '</div>';
            return html;
        }

        function buildData() {
          var sources = parseInt(document.getElementById('ds-sources').value);
          var displays = parseInt(document.getElementById('ds-displays').value);
          var dist = parseInt(document.getElementById('ds-distance').value);
          var resInput = document.querySelector('input[name="ds-res"]:checked');
          var res = resInput.value;
          var resLabel = resInput.nextElementSibling.innerText;
          
          var bom = [];
          var reasoning = "";
          var archName = "Ponto-a-Ponto Simples";
          var archDesc = "Ligação direta entre fonte e tela.";
          var isDist = sources > 1 || displays > 1;
          var eqName = null;
          var eqSku = null;
          var hasIp = false;
          var hasHdbaset = false;

          if (res === '1080p' && dist > 15) {
              hasIp = true;
          }

          if (!hasIp) {
              if (sources === 1 && displays > 1) {
                archName = "Distribuição Centralizada (Splitter)";
                archDesc = "Uma única fonte de sinal enviada simultaneamente e de forma espelhada para múltiplas telas.";
                eqName = "Splitter HDMI 1x" + (displays <= 2 ? "2" : "4") + " 4K";
                eqSku = displays <= 2 ? skus.splitter_1x2 : skus.splitter_1x4;
                reasoning += "Usando divisor (Splitter) para espelhar sinal. ";
              } else if (sources > 1 && displays >= 1) {
                archName = "Comutação Centralizada (Matriz)";
                archDesc = "Qualquer fonte pode ser roteada para qualquer tela, de forma independente.";
                var isSmall = sources <= 4 && displays <= 4;
                eqName = "Matriz HDMI " + (isSmall ? "4x4" : "8x8") + " 4K";
                eqSku = isSmall ? skus.matrix_4x4 : skus.matrix_8x8;
                reasoning += "Usando Matriz para comutação de múltiplas fontes. ";
              }
          } else {
             archName = "Matriz Virtual / Distribuição por IP (AV over IP)";
             archDesc = "Transmissores e Receptores ligados a um Switch de Rede formam uma matriz flexível via rede IP.";
             eqName = 'Switch de Rede (Gigabit)';
             reasoning += "Para 1080p a longas distâncias, o sistema IP (ESPO/NESC) atua nativamente como distribuidor/matriz pela rede. ";
          }

          if (eqName && !hasIp) {
            bom.push({ id: 'eq', cat: 'Equipamento', name: eqName, sku: eqSku, qty: 1 });
            bom.push({ id: 'c_in', cat: 'Cabeamento', name: 'Cabo HDMI Curto (Fonte)', sku: skus.short_hdmi, qty: sources });
          }

          if (res === '1080p') {
            if (dist <= 15) {
              var len = getClosestLength(dist, [1, 3, 5, 10, 15]);
              bom.push({ id: 'c_out', cat: 'Cabeamento', name: 'Cabo HDMI 1080p ('+len+'m)', sku: skus['cable_1080p_'+len+'m'], qty: displays });
            } else {
              var txSku = sources > 1 ? skus.nesc_tx : skus.espo_tx;
              var rxSku = sources > 1 ? skus.nesc_rx : skus.espo_rx;
              bom.push({ id: 'tx', cat: 'Transmissor', name: 'Transmissor AV IP', sku: txSku, qty: sources });
              bom.push({ id: 'rx', cat: 'Receptor', name: 'Receptor AV IP', sku: rxSku, qty: displays });
              bom.push({ id: 'sw', cat: 'Infra', name: 'Switch Gigabit IGMP', sku: skus.switch_gigabit, qty: 1 });
              
              var totalMeters = (sources+displays)*dist;
              var boxes = Math.ceil(totalMeters / 305);
              bom.push({ id: 'net', cat: 'Infra', name: 'Caixa de Cabo de Rede Cat6 (' + totalMeters + 'm est.)', sku: skus.cat6_meter, qty: boxes });
              bom.push({ id: 'c_sh', cat: 'Cabeamento', name: 'Cabo HDMI Curto (Telas e Fontes)', sku: skus.short_hdmi, qty: sources+displays });
            }
          } else if (res === '4k') {
            if (dist <= 5) {
              var len = getClosestLength(dist, [1, 3, 5]);
              bom.push({ id: 'c_out', cat: 'Cabeamento', name: 'Cabo HDMI 4K ('+len+'m)', sku: skus['cable_4k_'+len+'m'], qty: displays });
            } else if (dist <= 15) {
              var len = getClosestLength(dist, [10, 15]);
              reasoning += "Para 4K até 15m com Matriz/Splitter, usamos cabo de fibra óptica diretamente. ";
              bom.push({ id: 'fib', cat: 'Cabeamento', name: 'Cabo Fibra 4K ('+len+'m)', sku: skus['fiber_4k_'+len+'m'], qty: displays });
            } else {
              if (isDist) {
                reasoning += "Comutação em 4K a longa distância (>15m): recomendamos Extensores HDBaseT. (Nota: Para distâncias até 100m, cabos de fibra óptica também poderiam substituir o extensor). ";
                var use150 = dist > 40;
                hasHdbaset = true;
                bom.push({ id: 'hdbt', cat: 'Extensor', name: 'Extensor HDBaseT ('+(use150?'150m':'70m')+')', sku: use150 ? skus.hdbaset_150m : skus.hdbaset_70m, qty: displays });
                
                var totalMeters = displays*dist;
                var boxes = Math.ceil(totalMeters / 305);
                bom.push({ id: 'net', cat: 'Infra', name: 'Caixa de Cabo de Rede Cat6 (' + totalMeters + 'm est.)', sku: skus.cat6_meter, qty: boxes });
                bom.push({ id: 'c_sh', cat: 'Cabeamento', name: 'Cabo HDMI Curto (Tela)', sku: skus.short_hdmi, qty: displays });
              } else {
                var len = getClosestLength(dist, [10, 15, 20, 30, 50, 100]);
                reasoning += "Ponto-a-Ponto longo em 4K: Recomendamos Cabo HDMI de Fibra Óptica para garantir 100% do sinal. ";
                bom.push({ id: 'fib', cat: 'Cabeamento', name: 'Cabo Fibra 4K ('+len+'m)', sku: skus['fiber_4k_'+len+'m'], qty: displays });
              }
            }
          } else {
            var len = getClosestLength(dist, [3, 10, 15, 20, 50]);
            reasoning += "Sinal de altíssima banda (8K) exige sempre uso direto de Cabo HDMI de Fibra Óptica. ";
            bom.push({ id: 'fib8k', cat: 'Cabeamento', name: 'Cabo Fibra 8K ('+len+'m)', sku: skus['fiber_8k_'+len+'m'], qty: displays });
          }

          return {
              bom: bom,
              reasoning: reasoning,
              archName: archName,
              archDesc: archDesc,
              sources: sources,
              displays: displays,
              dist: dist,
              resLabel: resLabel,
              eqName: eqName,
              hasIp: hasIp,
              hasHdbaset: hasHdbaset
          };
        }

        function calculateAndFetch() {
          btnNext.innerText = 'Carregando...';
          btnNext.disabled = true;

          currentData = buildData();
          var uniqueSkus = [];
          currentData.bom.forEach(function(item) { if(uniqueSkus.indexOf(item.sku) === -1) uniqueSkus.push(item.sku); });

          var formData = new URLSearchParams();
          formData.append('action', 'discabos_get_skus');
          formData.append('skus', JSON.stringify(uniqueSkus));

          fetch(ajaxUrl, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          })
          .then(res => res.text())
          .then(text => {
            try {
              return JSON.parse(text);
            } catch(e) {
              throw new Error("Erro ao interpretar resposta do servidor: " + text.substring(0, 100));
            }
          })
          .then(data => {
            var products = data.success && data.data ? data.data.products : {};
            var debugInfo = data.success && data.data ? data.data.debug : {};
            currentData.products = products;
            renderBom(currentData, products, debugInfo);
            step = 2;
            updateSteps();
            btnNext.disabled = false;
          })
          .catch(err => {
            console.error(err);
            renderBom(currentData, {}, { 'erro': 'Falha na requisição AJAX: ' + err });
            step = 2;
            updateSteps();
            btnNext.disabled = false;
          });
        }

        function renderBom(data, products, debugInfo) {
          document.getElementById('ds-sum-sources').innerText = data.sources;
          document.getElementById('ds-sum-displays').innerText = data.displays;
          document.getElementById('ds-sum-dist').innerText = data.dist;
          document.getElementById('ds-sum-res').innerText = data.resLabel;

          document.getElementById('ds-arch-desc').innerText = data.archDesc;
          document.getElementById('ds-reasoning').innerText = data.reasoning;
          document.getElementById('ds-diagram-container').innerHTML = renderDiagramHtml(data.sources, data.displays, data.eqName, data.hasIp, data.hasHdbaset);
          document.getElementById('ds-email-feedback').innerText = ''; 

          var tbody = document.getElementById('ds-bom-body');
          tbody.innerHTML = '';
          var missingAny = false;
          
          data.bom.forEach(function(item) {
            var p = products ? products[item.sku] : null;
            if (!p && item.sku !== 'GEN-SWITCH') missingAny = true;
            
            var imgHtml = (p && p.image)
              ? '<img src="'+p.image+'" class="ds-product-img">'
              : '<div class="ds-product-img" style="background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:20px; color:#94a3b8;">📦</div>';
            
            var nameHtml = p ? p.name : item.name;
            var realCat = (p && p.real_category) ? p.real_category : item.cat;
            
            if (item.sku === 'GEN-SWITCH') {
                realCat = 'N/A';
            }
            
            var actionsHtml = '';
            
            if (item.sku === 'GEN-SWITCH') {
                actionsHtml = '<div style="font-size: 11px; color:var(--ds-main); font-weight:bold;">Produto não faz parte do catálogo</div>';
            } else if (p) {
                var addUrl = cartUrl + (cartUrl.indexOf('?') !== -1 ? '&' : '?') + 'add-to-cart=' + p.id + '&quantity=' + item.qty;
                actionsHtml = '<div class="ds-bom-actions" style="display:flex; flex-direction:column; gap:6px;">' +
                  '<a href="'+addUrl+'" target="_blank" class="ds-btn ds-btn-calc" style="font-size:12px; padding:8px 12px; color:white; text-decoration:none; text-align:center; border-radius:4px; font-weight:bold; text-transform:uppercase;">Adicionar</a>' +
                  '<a href="'+p.url+'" target="_blank" class="ds-btn ds-btn-prev" style="font-size:12px; padding:8px 12px; border: 1px solid #cbd5e1; background: white; color:#334155; text-decoration:none; text-align:center; border-radius:4px;">Ver Produto</a>' +
                  '</div>';
            } else {
                actionsHtml = '<div style="font-size: 11px; color:#94a3b8; font-style:italic;">Produto não encontrado</div>';
            }

            var tr = document.createElement('tr');
            tr.innerHTML = 
              '<td style="width: 72px;">' + imgHtml + '</td>' +
              '<td>' +
                 '<div style="font-weight:bold; font-size: 15px; color:#1e293b; margin-bottom: 4px;">'+nameHtml+'</div>' +
                 (item.sku === 'GEN-SWITCH' ? '<div style="font-size:12px; color:#64748b;">Este item não é comercializado pela Discabos, mas é necessário para a solução (Ex: Compre no mercado local).</div>' : '') +
              '</td>' +
              '<td><div style="font-size:12px; color:#64748b; font-family:monospace; background:#f1f5f9; padding:4px 6px; border-radius:4px; display:inline-block; border: 1px solid #e2e8f0;">'+item.sku+'</div></td>' +
              '<td><span style="background:#f8fafc; border: 1px solid #e2e8f0; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold; color: #475569;">'+realCat+'</span></td>' +
              '<td style="font-size:18px; font-weight:bold; text-align:center;">'+item.qty+'</td>' +
              '<td>' + actionsHtml + '</td>';
            
            tbody.appendChild(tr);
          });
          
          // Debugging Info (somente se algum produto não foi encontrado)
          var debugContainer = document.getElementById('ds-debug-container');
          if (!debugContainer) {
              debugContainer = document.createElement('div');
              debugContainer.id = 'ds-debug-container';
              document.getElementById('ds-step-4').appendChild(debugContainer);
          }
          
          if (missingAny && debugInfo && Object.keys(debugInfo).length > 0) {
              var debugHtml = '<div style="margin-top: 32px; padding: 16px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; font-size: 12px; color: #9f1239;">';
              debugHtml += '<strong style="display:block; margin-bottom: 8px;">[DEBUG] Produtos não localizados (Verifique os SKUs no painel do WordPress):</strong><ul style="margin:0; padding-left: 16px;">';
              for (var key in debugInfo) {
                  debugHtml += '<li><strong>' + key + '</strong>: ' + debugInfo[key] + '</li>';
              }
              debugHtml += '</ul></div>';
              debugContainer.innerHTML = debugHtml;
          } else {
              debugContainer.innerHTML = '';
          }
        }

      })();
    </script>
    <?php
    return ob_get_clean();
}
`;
}
