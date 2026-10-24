'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchSettingsThunk, updateSettingsThunk } from '../store/slices/settingsSlice';
import { api } from '../api/client';
import { Settings, Lock, IndianRupee, Save, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Shield, Gauge, Coins } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    listingFeeInr,
    listingFeeBypass,
    convenienceFeeInr,
    refundableDepositInr,
    coverPlusFeeInr,
    standardCoverFeeInr,
    unlimitedKmMultiplier,
    extraKmDefaultRateInr,
    loading,
  } = useAppSelector((state) => state.settings);

  // Listing Fee form state
  const [newFee, setNewFee] = useState<string>('499');
  const [feeBypass, setFeeBypass] = useState<boolean>(false);
  const [feeSaving, setFeeSaving] = useState<boolean>(false);
  const [feeSuccess, setFeeSuccess] = useState<string | null>(null);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Customer Dynamic Trip Pricing state (Zoomcar style)
  const [convenienceFee, setConvenienceFee] = useState<string>('791');
  const [deposit, setDeposit] = useState<string>('1000');
  const [coverPlus, setCoverPlus] = useState<string>('1919');
  const [standardCover, setStandardCover] = useState<string>('499');
  const [unlimitedMultiplier, setUnlimitedMultiplier] = useState<string>('1.2');
  const [extraKmRate, setExtraKmRate] = useState<string>('11');
  const [pricingSaving, setPricingSaving] = useState<boolean>(false);
  const [pricingSuccess, setPricingSuccess] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [pwdSaving, setPwdSaving] = useState<boolean>(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSettingsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (listingFeeInr !== undefined) {
      setNewFee(String(listingFeeInr));
    }
    if (listingFeeBypass !== undefined) {
      setFeeBypass(listingFeeBypass);
    }
    if (convenienceFeeInr !== undefined) {
      setConvenienceFee(String(convenienceFeeInr));
    }
    if (refundableDepositInr !== undefined) {
      setDeposit(String(refundableDepositInr));
    }
    if (coverPlusFeeInr !== undefined) {
      setCoverPlus(String(coverPlusFeeInr));
    }
    if (standardCoverFeeInr !== undefined) {
      setStandardCover(String(standardCoverFeeInr));
    }
    if (unlimitedKmMultiplier !== undefined) {
      setUnlimitedMultiplier(String(unlimitedKmMultiplier));
    }
    if (extraKmDefaultRateInr !== undefined) {
      setExtraKmRate(String(extraKmDefaultRateInr));
    }
  }, [
    listingFeeInr,
    listingFeeBypass,
    convenienceFeeInr,
    refundableDepositInr,
    coverPlusFeeInr,
    standardCoverFeeInr,
    unlimitedKmMultiplier,
    extraKmDefaultRateInr,
  ]);

  const handleSaveListingFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeSaving(true);
    setFeeSuccess(null);
    setFeeError(null);

    const feeNum = parseInt(newFee, 10);
    if (isNaN(feeNum) || feeNum < 0) {
      setFeeError('Please enter a valid listing fee amount in INR.');
      setFeeSaving(false);
      return;
    }

    try {
      await dispatch(
        updateSettingsThunk({
          listing_fee_inr: feeNum,
          listing_fee_bypass: feeBypass,
        }),
      ).unwrap();
      setFeeSuccess(`Listing fee updated to ₹${feeNum} successfully! Hosts will be charged this fee.`);
      setTimeout(() => setFeeSuccess(null), 5000);
    } catch (err: any) {
      setFeeError(err.message || 'Failed to update listing fee.');
    } finally {
      setFeeSaving(false);
    }
  };

  const handleSavePricingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingSaving(true);
    setPricingSuccess(null);
    setPricingError(null);

    const convNum = parseInt(convenienceFee, 10);
    const depNum = parseInt(deposit, 10);
    const cpNum = parseInt(coverPlus, 10);
    const scNum = parseInt(standardCover, 10);
    const multNum = parseFloat(unlimitedMultiplier);
    const kmNum = parseInt(extraKmRate, 10);

    if (isNaN(convNum) || isNaN(depNum) || isNaN(cpNum) || isNaN(scNum) || isNaN(multNum) || isNaN(kmNum)) {
      setPricingError('Please enter valid numeric values for all pricing fields.');
      setPricingSaving(false);
      return;
    }

    try {
      await dispatch(
        updateSettingsThunk({
          convenience_fee_inr: convNum,
          refundable_deposit_inr: depNum,
          cover_plus_fee_inr: cpNum,
          standard_cover_fee_inr: scNum,
          unlimited_km_multiplier: multNum,
          extra_km_default_rate_inr: kmNum,
        }),
      ).unwrap();
      setPricingSuccess('Customer trip pricing, convenience fee & deposit settings updated successfully!');
      setTimeout(() => setPricingSuccess(null), 5000);
    } catch (err: any) {
      setPricingError(err.message || 'Failed to update pricing settings.');
    } finally {
      setPricingSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSaving(true);
    setPwdSuccess(null);
    setPwdError(null);

    if (!newPassword || newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      setPwdSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirm password do not match.');
      setPwdSaving(false);
      return;
    }

    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPwdSuccess('Admin password changed successfully! Use your new password on next login.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(null), 5000);
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password. Ensure current password is correct.');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <Settings className="w-5 h-5 text-red-500" />
          <span>Platform Settings & Security</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure vehicle listing fees charged to fleet hosts, manage admin password, and platform policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Vehicle Listing Fee Settings */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Vehicle Listing Fee</h3>
              <p className="text-[11px] text-slate-400">Set the mandatory fee charged when a host lists a car</p>
            </div>
          </div>

          <form onSubmit={handleSaveListingFee} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Listing Fee Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-red-500 transition"
                  placeholder="e.g. 499"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Currently configured: <span className="font-bold text-slate-300">₹{listingFeeInr}</span> (
                {(listingFeeInr * 100).toLocaleString('en-IN')} paise)
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Listing Fee Bypass</p>
                <p className="text-[10px] text-slate-400">For internal testing only (skips Razorpay checkout)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={feeBypass}
                  onChange={(e) => setFeeBypass(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {feeSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feeSuccess}</span>
              </div>
            )}

            {feeError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feeError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={feeSaving || loading}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-red-950/40"
            >
              {feeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Listing Fee Settings</span>
            </button>
          </form>
        </div>

        {/* 2. Admin Password Change */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Change Admin Password</h3>
              <p className="text-[11px] text-slate-400">Update your administrator portal login password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current password (default: admin123)"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-red-500 transition"
              />
            </div>

            {pwdSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            {pwdError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pwdSaving || !newPassword || !confirmPassword}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/40"
            >
              {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* 3. Customer Trip Pricing & Protection Breakdown (Zoomcar Style) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Customer Trip Pricing & Protection Policies (Zoomcar Style)</h3>
            <p className="text-[11px] text-slate-400">
              Live configuration for Customer Vehicle Detail Screen, dynamic price quotes, convenience fees, security deposits, and protection plans.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePricingSettings} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Convenience Fee */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Convenience Fee (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={convenienceFee}
                  onChange={(e) => setConvenienceFee(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. 791"
                />
              </div>
              <p className="text-[10px] text-slate-500">Platform convenience fee charged on customer checkout</p>
            </div>

            {/* Refundable Security Deposit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Refundable Deposit (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. 1000"
                />
              </div>
              <p className="text-[10px] text-slate-500">Refundable security deposit (Pay Now or Pay Later)</p>
            </div>

            {/* Cover PLUS Fee */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Cover PLUS Fee (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={coverPlus}
                  onChange={(e) => setCoverPlus(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. 1919"
                />
              </div>
              <p className="text-[10px] text-slate-500">Enhanced protection plan (Max ₹2,999 liability)</p>
            </div>

            {/* Standard Cover Fee */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Standard Cover Fee (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={standardCover}
                  onChange={(e) => setStandardCover(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. 499"
                />
              </div>
              <p className="text-[10px] text-slate-500">Basic trip protection (Max ₹9,999 liability)</p>
            </div>

            {/* Unlimited Km Multiplier */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Unlimited Km Rate Multiplier
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs">
                  ×
                </span>
                <input
                  type="number"
                  min="1.0"
                  max="3.0"
                  step="0.05"
                  value={unlimitedMultiplier}
                  onChange={(e) => setUnlimitedMultiplier(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. 1.2"
                />
              </div>
              <p className="text-[10px] text-slate-500">Multiplier over base rent (e.g. 1.2 = +20% for Unlimited Kms)</p>
            </div>

            {/* Default Extra Km Rate */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Default Extra Km Fee (₹/km)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={extraKmRate}
                  onChange={(e) => setExtraKmRate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-purple-500 transition"
                  placeholder="e.g. 11"
                />
              </div>
              <p className="text-[10px] text-slate-500">Default rate charged for excess km driven on limited packages</p>
            </div>
          </div>

          {pricingSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pricingSuccess}</span>
            </div>
          )}

          {pricingError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pricingError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-500">
              Changes reflect immediately on the Customer Vehicle Detail screen and dynamically calculate in real-time.
            </p>
            <button
              type="submit"
              disabled={pricingSaving || loading}
              className="py-2.5 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-purple-950/40"
            >
              {pricingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Pricing & Policy Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
