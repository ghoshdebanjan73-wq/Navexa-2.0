/**
 * printInvoice.js
 * Utility to generate and print/export a pixel-perfect, standalone A4 Tax Invoice document.
 * Avoids modal container clipping and CSS visibility bugs by appending a dedicated print DOM element directly to body.
 */

import { formatINR } from '../data/tripStore'

export function printInvoice(invoice) {
  if (!invoice) return

  const company = invoice.companyDetails || {}
  const trip = invoice.tripDetails || {}
  const payments = Array.isArray(invoice.payments) ? invoice.payments : []

  const totalAmount = Number(invoice.totalAmount || 0)
  const amountPaid = Number(invoice.amountPaid || 0)
  const balanceDue = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, totalAmount - amountPaid))
  const paymentStatus = invoice.paymentStatus || (balanceDue === 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Pending')

  // Status colors for print badge
  const statusBadgeStyle = 
    paymentStatus === 'Paid'
      ? 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;'
      : paymentStatus === 'Partially Paid'
      ? 'background: #fef3c7; color: #b45309; border: 1px solid #fde047;'
      : paymentStatus === 'Overdue'
      ? 'background: #ffe4e6; color: #be123c; border: 1px solid #fca5a5;'
      : 'background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;'

  // Existing print container cleanup
  const existingContainer = document.getElementById('navexa-a4-print-root')
  if (existingContainer) {
    existingContainer.remove()
  }

  // Create isolated print container
  const printContainer = document.createElement('div')
  printContainer.id = 'navexa-a4-print-root'

  // Build complete A4 HTML markup
  printContainer.innerHTML = `
    <style>
      @media print {
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        body * {
          visibility: hidden !important;
        }
        #navexa-a4-print-root, #navexa-a4-print-root * {
          visibility: visible !important;
        }
        #navexa-a4-print-root {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          font-size: 12px !important;
          line-height: 1.5 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }

      /* Screen Preview Style when appended */
      #navexa-a4-print-root {
        box-sizing: border-box;
        max-width: 800px;
        margin: 0 auto;
        padding: 30px;
        background: #ffffff;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .inv-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 20px;
        margin-bottom: 20px;
      }

      .inv-brand-title {
        font-size: 20px;
        font-weight: 900;
        color: #0f172a;
        margin: 0 0 4px 0;
        letter-spacing: -0.5px;
      }

      .inv-brand-sub {
        font-size: 11px;
        color: #64748b;
        margin: 0;
      }

      .inv-doc-title {
        font-size: 24px;
        font-weight: 900;
        color: #0f172a;
        text-align: right;
        margin: 0 0 6px 0;
        letter-spacing: 1px;
      }

      .inv-meta-table {
        margin-left: auto;
        font-size: 11px;
        text-align: right;
      }

      .inv-meta-table td {
        padding: 2px 0 2px 10px;
      }

      .inv-status-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .inv-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }

      .inv-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px;
        font-size: 11px;
      }

      .inv-box-title {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }

      .inv-box-name {
        font-size: 13px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 3px;
      }

      .inv-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      .inv-table th {
        background: #f1f5f9;
        color: #475569;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 10px 12px;
        border-bottom: 1px solid #cbd5e1;
        text-align: left;
      }

      .inv-table td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 11px;
      }

      .inv-totals-wrap {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .inv-totals-box {
        width: 280px;
        margin-left: auto;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 12px 16px;
        font-size: 11px;
      }

      .inv-totals-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        color: #475569;
      }

      .inv-totals-row.grand-total {
        border-top: 2px solid #e2e8f0;
        margin-top: 6px;
        padding-top: 8px;
        font-size: 14px;
        font-weight: 900;
        color: #0f172a;
      }

      .inv-pay-summary {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px 16px;
        margin-bottom: 20px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        text-align: center;
      }

      .inv-pay-metric-title {
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        color: #64748b;
      }

      .inv-pay-metric-val {
        font-size: 13px;
        font-weight: 900;
        color: #0f172a;
        margin-top: 2px;
      }

      .inv-footer {
        border-top: 1px solid #e2e8f0;
        padding-top: 15px;
        text-align: center;
        font-size: 10px;
        color: #64748b;
      }
    </style>

    <!-- HEADER -->
    <div class="inv-header">
      <div>
        ${company.logoUrl ? `
          <img src="${company.logoUrl}" alt="Logo" style="max-height: 44px; margin-bottom: 6px; display: block;" />
        ` : `
          <h1 class="inv-brand-title">${company.businessName || 'Navexa Transport & Logistics'}</h1>
        `}
        <p class="inv-brand-sub">${company.address || 'Hooghly, West Bengal, India'}</p>
        <p class="inv-brand-sub">Phone: ${company.phone || '+91 98765 43210'} | Email: ${company.email || 'billing@navexa.io'}</p>
        ${company.gstNumber ? `<p class="inv-brand-sub" style="font-weight:700; color:#0f172a; margin-top:2px;">GSTIN: ${company.gstNumber}</p>` : ''}
      </div>

      <div>
        <h2 class="inv-doc-title">TAX INVOICE</h2>
        <table class="inv-meta-table">
          <tr>
            <td style="color:#64748b;">Invoice No:</td>
            <td style="font-weight:800; color:#0f172a;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Invoice Date:</td>
            <td style="font-weight:700;">${invoice.invoiceDate || ''}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Due Date:</td>
            <td style="font-weight:700;">${invoice.dueDate || ''}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Status:</td>
            <td><span class="inv-status-badge" style="${statusBadgeStyle}">${paymentStatus}</span></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- BILLED TO & TRIP SUMMARY -->
    <div class="inv-grid-2">
      <div class="inv-box">
        <div class="inv-box-title">Billed To (Customer)</div>
        <div class="inv-box-name">${invoice.customerName}</div>
        <div>Phone: <strong>${invoice.customerPhone || 'N/A'}</strong></div>
        ${invoice.customerEmail ? `<div>Email: <strong>${invoice.customerEmail}</strong></div>` : ''}
        ${invoice.customerAddress ? `<div style="margin-top:4px;">${invoice.customerAddress}</div>` : ''}
      </div>

      <div class="inv-box">
        <div class="inv-box-title">Trip Reference & Particulars</div>
        <div class="inv-box-name">${invoice.tripId ? `Trip #${invoice.tripId}` : 'Direct Service Booking'}</div>
        <div>Route: <strong>${trip.pickupLocation || 'Pickup'} ➔ ${trip.destination || 'Destination'}</strong></div>
        <div>Vehicle: <strong>${trip.vehicle || 'Fleet Vehicle'}</strong> ${trip.vehicleReg ? `(${trip.vehicleReg})` : ''}</div>
        <div>Driver: <strong>${trip.driverName || 'Assigned Driver'}</strong></div>
      </div>
    </div>

    <!-- LINE ITEMS TABLE -->
    <table class="inv-table">
      <thead>
        <tr>
          <th>Description & Particulars</th>
          <th style="text-align:center;">Qty / Distance</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div style="font-weight:800; color:#0f172a;">Transport & Freight Services</div>
            <div style="font-size:10px; color:#64748b; margin-top:2px;">
              Route: ${trip.pickupLocation || 'Pickup'} ➔ ${trip.destination || 'Destination'} (${trip.tripDate || invoice.invoiceDate})
            </div>
          </td>
          <td style="text-align:center;">${trip.estimatedDistance ? `${trip.estimatedDistance} km` : '1 Service'}</td>
          <td style="text-align:right;">${formatINR(invoice.subtotal)}</td>
          <td style="text-align:right; font-weight:800;">${formatINR(invoice.subtotal)}</td>
        </tr>
      </tbody>
    </table>

    <!-- TOTALS BLOCK -->
    <div class="inv-totals-wrap">
      <div style="flex: 1; padding-right: 20px;">
        ${invoice.notes ? `
          <div class="inv-box" style="margin-bottom:0;">
            <div class="inv-box-title">Invoice Notes & Instructions</div>
            <div style="white-space: pre-wrap; font-size:10px;">${invoice.notes}</div>
          </div>
        ` : ''}
      </div>

      <div class="inv-totals-box">
        <div class="inv-totals-row">
          <span>Subtotal</span>
          <span style="font-weight:700; color:#0f172a;">${formatINR(invoice.subtotal)}</span>
        </div>
        <div class="inv-totals-row">
          <span>Tax (GST 0%)</span>
          <span style="font-weight:700; color:#0f172a;">${formatINR(invoice.taxAmount || 0)}</span>
        </div>
        <div class="inv-totals-row grand-total">
          <span>Total Billed</span>
          <span style="color:#0f172a;">${formatINR(totalAmount)}</span>
        </div>
      </div>
    </div>

    <!-- PAYMENT BREAKDOWN SUMMARY -->
    <div class="inv-pay-summary">
      <div>
        <div class="inv-pay-metric-title">Invoice Total</div>
        <div class="inv-pay-metric-val">${formatINR(totalAmount)}</div>
      </div>
      <div>
        <div class="inv-pay-metric-title" style="color:#15803d;">Amount Paid</div>
        <div class="inv-pay-metric-val" style="color:#15803d;">${formatINR(amountPaid)}</div>
      </div>
      <div>
        <div class="inv-pay-metric-title" style="color:#be123c;">Balance Due</div>
        <div class="inv-pay-metric-val" style="color:#be123c;">${formatINR(balanceDue)}</div>
      </div>
      <div>
        <div class="inv-pay-metric-title">Payment Status</div>
        <div class="inv-pay-metric-val" style="font-size:11px;">
          <span class="inv-status-badge" style="${statusBadgeStyle}">${paymentStatus}</span>
        </div>
      </div>
    </div>

    <!-- PAYMENT HISTORY TABLE (IF PAYMENTS EXIST) -->
    ${payments.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <div class="inv-box-title" style="margin-bottom:8px;">Payment Collection History (${payments.length})</div>
        <table class="inv-table" style="margin-bottom:0;">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Payment Method</th>
              <th>Reference / UTR</th>
              <th>Collected By</th>
              <th style="text-align:right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td>${p.date || p.paymentDate} ${p.time || ''}</td>
                <td style="font-weight:700;">${p.paymentMethod || 'Cash'}</td>
                <td style="font-family: monospace;">${p.referenceNumber || '—'}</td>
                <td>${p.recordedBy || p.collectedBy || 'Admin'}</td>
                <td style="text-align:right; font-weight:800; color:#15803d;">${formatINR(p.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- FOOTER -->
    <div class="inv-footer">
      <p style="font-weight:800; color:#0f172a; margin:0 0 4px 0;">Thank you for doing business with ${company.businessName || 'Navexa Logistics'}!</p>
      <p style="margin:0;">This is a computer-generated Tax Invoice. No physical signature required.</p>
    </div>
  `

  document.body.appendChild(printContainer)

  // Trigger browser print
  setTimeout(() => {
    window.print()
    setTimeout(() => {
      if (printContainer && printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer)
      }
    }, 1000)
  }, 250)
}
