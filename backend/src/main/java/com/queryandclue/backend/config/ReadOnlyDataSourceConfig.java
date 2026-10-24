package com.queryandclue.backend.config;

import javax.sql.DataSource;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class ReadOnlyDataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @Primary
    public DataSource primaryDataSource() {
        return primaryDataSourceProperties().initializeDataSourceBuilder().build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.readonly")
    public DataSourceProperties readOnlyDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource readOnlyDataSource() {
        try {
            DataSourceProperties props = readOnlyDataSourceProperties();
            if (props.getUrl() == null || props.getUrl().isBlank()) {
                return primaryDataSource();
            }
            return props.initializeDataSourceBuilder().build();
        } catch (Exception e) {
            return primaryDataSource();
        }
    }
}