package com.ecommerce.dto;

public class AdminDashboardResponse {
    private long totalOrders;
    private long pendingOrders;
    private long totalCustomers;
    private double revenue;

    public AdminDashboardResponse(long totalOrders, long pendingOrders, long totalCustomers, double revenue) {
        this.totalOrders = totalOrders;
        this.pendingOrders = pendingOrders;
        this.totalCustomers = totalCustomers;
        this.revenue = revenue;
    }

    public long getTotalOrders() { return totalOrders; }
    public long getPendingOrders() { return pendingOrders; }
    public long getTotalCustomers() { return totalCustomers; }
    public double getRevenue() { return revenue; }
}